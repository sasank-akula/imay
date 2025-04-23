sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment"
], (Controller, Fragment) => {
    "use strict";

    return Controller.extend("com.sap.imayl.controller.View1", {
        onInit() {
            this._fragments = {};
        },

        onCollapseExpandPress() {
            const oSideNavigation = this.byId("sideNavigation"),
                bExpanded = oSideNavigation.getExpanded();

            oSideNavigation.setExpanded(!bExpanded);
        },

        onItemSelect: function (oEvent) {
            const sKey = oEvent.getParameter("item").getKey();
            const oContainer = this.byId("pageContainer");

            const mFragments = {
                sla: "com.sap.imayl.view.fragments.SLACompliance",
                pending: "com.sap.imayl.view.fragments.PendingDeliveries",
                researched: "com.sap.imayl.view.fragments.ResearchedPackages",
                productivity: "com.sap.imayl.view.fragments.UserProductivity"
            };

            const mTitles = {
                sla: "SLA Compliance",
                pending: "Pending Deliveries",
                researched: "Researched Packages",
                productivity: "User Productivity"
            };

            this.getView().byId("_IDGenText1").setProperty("text", mTitles[sKey] || "");

            // Hide previously visible fragment
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
                    oFragment.setVisible(true);
                });
            } else {
                this._fragments[sKey].setVisible(true);
            }
        }
    });
});
