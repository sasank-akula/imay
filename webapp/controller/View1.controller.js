sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/BusyDialog",
    "sap/m/MessageToast",
    "sap/m/MessageBox"

], (Controller, Fragment, BusyDialog, MessageToast,MessageBox) => {
    "use strict";

    return Controller.extend("com.sap.imayl.controller.View1", {
        onInit: function () {
            this._fragments = {};
            this.oModel = this.getView().getModel();
            var oEmailModel = new sap.ui.model.json.JSONModel({
                emailTemplates: [
                    {
                        code: "TMP001",
                        templateName: "Default Tender",
                        templateDescription: "Tender package status of trackingno",
                        statusName: "Tender",
                        placeHolder: "PH1",
                        isActive: true,
                        subject: "Tender Notification",
                        emailBody: "<p>Hello, your package is in Tender stage.</p>",
                        smsText: "Your package is in Tender stage."
                    },
                    {
                        code: "TMP002",
                        templateName: "Default Received",
                        templateDescription: "Received package status of trackingno",
                        statusName: "Received",
                        placeHolder: "PH2",
                        isActive: false,
                        subject: "Received Notification",
                        emailBody: "<p>Hello, your package has been received.</p>",
                        smsText: "Your package has been received."
                    }
                ]
            });
            this.getView().setModel(oEmailModel, "emailModel");

            this._oBusyDialog = new BusyDialog({
                title: "Loading",
                text: "Please wait..."
            });
            this._oEmailDialog = null;
            this._oAddDialog = null;
        },

        onCollapseExpandPress() {
            const oSideNavigation = this.byId("sideNavigation");
            const bExpanded = oSideNavigation.getExpanded();
            oSideNavigation.setExpanded(!bExpanded);
            const oImage = this.byId("_IDGenImage");
            if (bExpanded) {
                oImage.setSrc("/img/mlogo.png");
            } else {
                oImage.setSrc("/img/logo.png");
            }

        },

        onItemSelect: function (oEvent) {
            this._oBusyDialog.open();
            const sKey = oEvent.getParameter("item").getKey();
            const oContainer = this.byId("pageContainer");

            const mFragments = {
                sla: "com.sap.imayl.view.fragments.SLACompliance",
                pending: "com.sap.imayl.view.fragments.PendingDeliveries",
                researched: "com.sap.imayl.view.fragments.ResearchedPackages",
                productivity: "com.sap.imayl.view.fragments.UserProductivity",
                email: "com.sap.imayl.view.fragments.EmailEditor",
                user: "com.sap.imayl.view.fragments.UserManagemant"
            };

            const mTitles = {
                sla: "SLA Compliance",
                pending: "Pending Deliveries",
                researched: "Researched Packages",
                productivity: "User Productivity",
                email: "Email Editor",
                user: "User Management"
            };

            this.getView().byId("_IDGenText1").setProperty("text", mTitles[sKey] || "");

            if (this._currentKey && this._fragments[this._currentKey]) {
                this._fragments[this._currentKey].setVisible(false);
            }

            this._currentKey = sKey;

            const sFragmentPath = mFragments[sKey];
            if (!sFragmentPath) {
                return;
            }

            if (!this._fragments[sKey]) {
                Fragment.load({
                    name: sFragmentPath,
                    id: this.getView().getId(),
                    controller: this
                }).then((oFragment) => {
                    this._fragments[sKey] = oFragment;
                    oContainer.addItem(oFragment);

                    oFragment.setModel(this.getView().getModel("emailModel"), "emailModel");

                    oFragment.setVisible(true);
                    this._oBusyDialog.close();
                });
            } else {
                this._fragments[sKey].setVisible(true);
                this._oBusyDialog.close();
            }

        },
        onAddTemplate: function () {
            this._openEmailDialog("add");
        },

        onEditTemplate: function (oEvent) {
            const oContext = oEvent.getSource().getParent().getBindingContext("emailModel");
            const oData = oContext.getObject();
            this._selectedIndex = oContext.getPath();
            this._openEmailDialog("edit", oData);
        },

        onDeleteTemplate: function (oEvent) {
            const oContext = oEvent.getSource().getParent().getBindingContext("emailModel");
            const oPath = oContext.getPath();
            const oModel = this.getView().getModel("emailModel");

            var aData = oModel.getProperty("/emailTemplates");
            aData.splice(parseInt(oPath.split("/")[2]), 1);
            oModel.refresh();
        },

        _openEmailDialog: function (mode, oData) {
            this._oBusyDialog.open()
            if (!this._oEmailDialog) {
                Fragment.load({
                    name: "com.sap.imayl.view.fragments.EmailEditorDialog",
                    controller: this
                }).then((oDialog) => {
                    this._oEmailDialog = oDialog;
                    this.getView().addDependent(this._oEmailDialog);
                    this._prepareDialog(mode, oData);
                    this._oEmailDialog.open();
                    this._oBusyDialog.close()
                });
            } else {
                this._prepareDialog(mode, oData);
                this._oEmailDialog.open();
                this._oBusyDialog.close();
            }
        },

        _prepareDialog: function (mode, oData) {
            console.log(oData);

            var oDialogModel = new sap.ui.model.json.JSONModel(oData || {
                code: "",
                statusName: "",
                templateName: "",
                templateDescription: "",
                placeHolder: "",
                subject: "",
                emailBody: "",
                smsText: "",
                isActive: false
            });

            this._oEmailDialog.setModel(oDialogModel, "dialogModel");

            this._oEmailDialog.setBindingContext(
                new sap.ui.model.Context(oDialogModel, "/"),
                "dialogModel"
            );

            console.log(this._oEmailDialog.getModel("dialogModel"));
            this._mode = mode;
        }

        ,

        onSaveDialog: function () {
            var oDialogModel = this._oEmailDialog.getModel("dialogModel");
            var oNewData = oDialogModel.getData();

            const oModel = this.getView().getModel("emailModel");
            var aData = oModel.getProperty("/emailTemplates");

            if (this._mode === "add") {
                aData.push(oNewData);
            } else if (this._mode === "edit" && this._selectedIndex) {
                oModel.setProperty(this._selectedIndex, oNewData);
            }

            oModel.refresh();
            this._oEmailDialog.close();
        },
        onCancelDialog: function () {
            this._oEmailDialog.close();
        },

        onFileUpload: function (event) {
            var that = this;
            var file = event.getParameter("files")[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, {
                    type: 'array'
                });
                // Extract data from the first sheet
                var worksheet = workbook.Sheets[workbook.SheetNames[0]];
                var jsonData = XLSX.utils.sheet_to_json(worksheet);
                // Use the jsonData as desired (e.g., display in a table, perform operations, etc.)
                const oTable=that.byId("table1");
                const oBinding = oTable.getBinding("rows");

                jsonData.forEach((oPayload) => {
                    oBinding.create(oPayload,{
                        groupId: "deferredGroup"
                    });
                });
              
            };
            reader.readAsArrayBuffer(file);
        },

        onClearAllData: async function () {
            const oModel = this.getView().getModel(); // OData V4 model
            const oTable = this.byId("table1");
            const oBinding = oTable.getBinding("rows");
            const aContexts = oBinding.getContexts();
            aContexts.forEach(oContext => {
                oContext.delete("deferredGroup"); // or "deferredGroup" if batching is set in manifest
            });
        },
        onAddRow: function () {
            const oTable = this.byId("table1");
            const oBinding = oTable.getBinding("rows");
        
            const oNewUser = {
                accessType: "",
                address1: "",
                city: "",
                country: "",
                department: "",
                emailID: "",
                empID: "",
                firstName: "",
                language: "",
                lastName: "",
                location: "",
                phone: "",
                role: "",
                state: "",
                status: "",
                userType: "",
                zipcode: ""
            };
        
            oBinding.create(oNewUser, {
                groupId: "deferredGroup" 
            });
        } ,
        onSave: function () {
            const oModel = this.getView().getModel();
        
            oModel.submitBatch("deferredGroup")
                .then((oResponse) => {
                    sap.m.MessageToast.show("Changes saved successfully");
                    // Optional: Refresh the table or bindings here if needed
                })
                .catch((oError) => {
                    sap.m.MessageBox.error("Save failed: " + oError.message);
                });
        },
        onDeleteSelectedRows: function () {
            const oTable = this.byId("table1"); // sap.ui.table.Table
            const oModel = this.getView().getModel();
            const aSelectedIndices = oTable.getSelectedIndices();
        
            if (aSelectedIndices.length === 0) {
                sap.m.MessageToast.show("No rows selected for deletion.");
                return;
            }
        
            aSelectedIndices.forEach(iIndex => {
                const oContext = oTable.getContextByIndex(iIndex);
                if (oContext) {
                    oContext.delete("$auto"); // or your batch group ID
                }
            });
        
            oModel.submitBatch("$auto")
                .then(() => {
                    sap.m.MessageToast.show("Selected records deleted successfully.");
                })
                .catch(err => {
                    sap.m.MessageBox.error("Deletion failed: " + err.message);
                });
        },
        onEnableAllInputs: function () {
            debugger
            // Array of input IDs
            const inputIds = [
                "_IDGenInput1", "_IDGenInput2", "_IDGenInput3", "_IDGenInput4",
                "_IDGenInput5", "_IDGenInput6", "_IDGenInput7", "_IDGenInput8",
                "_IDGenInput9", "_IDGenInput10", "_IDGenInput11", "_IDGenInput12",
                "_IDGenInput13", "_IDGenInput14", "_IDGenInput15", "_IDGenInput16",
                "_IDGenInput"
            ];
        
            // Loop through the array and set each input to editable
            inputIds.forEach(id => {
                this.byId(id).setEditable(true);
            });
        }     
    });
   
});
