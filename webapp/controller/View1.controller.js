sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/BusyDialog",
    "sap/m/MessageToast"
], (Controller, Fragment, BusyDialog,MessageToast) => {
    "use strict";

    return Controller.extend("com.sap.imayl.controller.View1", {
        onInit: function () {
            this._fragments = {};

            var oEmailModel = new sap.ui.model.json.JSONModel({
                emailTemplates:  [
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
        onAfterRendering: function () {
            var oTable = this.byId("userTable");
            var oBinding = oTable.getBinding("items");
        
            // Update header when items are loaded or changed
            oBinding.attachChange(() => {
                var iCount = oBinding.getLength();
                oTable.setHeaderText("Total Items: " + iCount);
            });
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
           console.log( this.getView().getModel());
            this._oBusyDialog.open();
            const sKey = oEvent.getParameter("item").getKey();
            const oContainer = this.byId("pageContainer");

            const mFragments = {
                sla: "com.sap.imayl.view.fragments.SLACompliance",
                pending: "com.sap.imayl.view.fragments.PendingDeliveries",
                researched: "com.sap.imayl.view.fragments.ResearchedPackages",
                productivity: "com.sap.imayl.view.fragments.UserProductivity",
                email: "com.sap.imayl.view.fragments.EmailEditor",
                user:"com.sap.imayl.view.fragments.UserManagemant"
            };

            const mTitles = {
                sla: "SLA Compliance",
                pending: "Pending Deliveries",
                researched: "Researched Packages",
                productivity: "User Productivity",
                email: "Email Editor",
                user:"User Management"
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

            var oModel = this.getView().getModel("emailModel");
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


        onAddUser: function () {
            if (!this._oAddDialog) {
                Fragment.load({
                    id: "AddUserFragment",
                    name: "com.sap.imayl.view.fragments.AddUser",
                    controller: this
                }).then((oDialog) => {
                    this._oAddDialog = oDialog;
                    this.getView().addDependent(this._oAddDialog);
                    this._oAddDialog.open();
                });
            } else {
                this._oAddDialog.open(); // Fix: open _oAddDialog, not _oEmailDialog
            }
        }
        
        
        ,
        onSavePress: function () {
            const getInputValue = (id) => Fragment.byId("AddUserFragment", id)?.getValue();
        
            const oUserData = {
                empID: getInputValue("empID"),
                firstName: getInputValue("firstName"),
                lastName: getInputValue("lastName"),
                emailID: getInputValue("emailID"),
                phone: getInputValue("phone"),
                role: getInputValue("role"),
                department: getInputValue("department"),
                userType: getInputValue("userType"),
                accessType: getInputValue("accessType"),
                language: getInputValue("language"),
                status: getInputValue("status"),
                address1: getInputValue("address1"),
                city: getInputValue("city"),
                state: getInputValue("state"),
                country: getInputValue("country"),
                zipcode: getInputValue("zipcode"),
                location: getInputValue("location")
            };
            var oModel=this.getView().getModel();
            var oBinding=oModel.bindList("/Users")
            var oContext=oBinding.create(oUserData);
            oContext.created().then(()=>{
                MessageToast.show("Success")
            }).catch((error)=>{
                MessageToast.show("Error")
                console.log(error)
            })

            this._oAddDialog.close();
        }
        ,
        onCancelPress:function(){
                this._oAddDialog.close();
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
        
                const oModel = that.getView().getModel();
                const groupId = "myBatchGroup";
        
                const oBinding = oModel.bindList("/Users");
        
                jsonData.forEach((oPayload) => {
                    oBinding.create(oPayload);
                });
        
                oModel.submitBatch(groupId).then(() => {
                    MessageToast.show("All records uploaded successfully!");
                }).catch((oError) => {
                    MessageBox.error("Error uploading records: " + oError.message);
                });
            };
            reader.readAsArrayBuffer(file);
        },

        onClearAllData: async function () {
            const groupId = "myBatchGroup";
            const oModel = this.getView().getModel(); // OData V4 model
            const oListBinding = oModel.bindList("/Users");
        
                const aContexts = await oListBinding.requestContexts(); // fetch contexts (data)
        
                for (let oContext of aContexts) {
                    await oContext.delete(); // delete each item
                }
                oModel.submitBatch(groupId).then(() => {
                    MessageToast.show("All records uploaded successfully!");
                }).catch((oError) => {
                    MessageBox.error("Error uploading records: " + oError.message);
                });
              
             
        }
        
        
        
        
        

    });
});
