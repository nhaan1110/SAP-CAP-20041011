sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/Label",
    "sap/m/Input"
], function (Controller, History, MessageToast, MessageBox, Dialog, Button, VBox, Label, Input) {
    "use strict";

    return Controller.extend("zbooks.controller.Detail", {

        /**
         * Khởi tạo Controller
         */
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        /**
         * Xử lý khi Router khớp với RouteDetail
         * @param {sap.ui.base.Event} oEvent 
         */
        _onObjectMatched: function (oEvent) {
            // 1. Lấy tham số bookId từ URL 
            var sBookId = oEvent.getParameter("arguments").bookId;

            // 2. Bind Element (OData V4 Context) 
            this.getView().bindElement({
                path: "/Books(" + sBookId + ")"
            });
        },

        onEditPress: function () {
            MessageToast.show("Bấm nút Edit thành công!");
        },

     
        onDeletePress: function () {
            MessageBox.confirm("Bạn có chắc muốn xóa không?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        MessageToast.show("Đã xóa thành công!");
                    }
                }
            });
        },

        onEditPress: function () {
            var oView = this.getView();
            var oContext = oView.getBindingContext();

            if (!oContext) {
                MessageToast.show("Không tìm thấy dữ liệu sách!");
                return;
            }

            if (!this._oEditDialog) {
                this._oEditDialog = new Dialog({
                    title: "Chỉnh sửa thông tin sách",
                    contentWidth: "400px",
                    content: [
                        new VBox({
                            class: "sapUiSmallMargin",
                            items: [
                                new Label({ text: "Tựa sách (Title)" }),
                                new Input({ value: "{title}" }),
                                new Label({ text: "Tác giả (Author)", class: "sapUiSmallMarginTop" }),
                                new Input({ value: "{author}" }),
                                new Label({ text: "Số lượng tồn kho (Stock)", class: "sapUiSmallMarginTop" }),
                                new Input({ value: "{stock}", type: "Number" })
                            ]
                        })
                    ],
                    beginButton: new Button({
                        text: "Lưu",
                        type: "Emphasized",
                        press: function () {
                            oView.getModel().submitBatch("$auto").then(function () {
                                MessageToast.show("Đã cập nhật vào cơ sở dữ liệu!");
                                this._oEditDialog.close();
                            }.bind(this)).catch(function (oError) {
                                MessageBox.error("Lưu thất bại: " + oError.message);
                            });
                        }.bind(this)
                    }),
                    endButton: new Button({
                        text: "Hủy",
                        press: function () {
                            if (oContext.hasPendingChanges()) {
                                oContext.resetChanges();
                            }
                            this._oEditDialog.close();
                        }.bind(this)
                    })
                });
                oView.addDependent(this._oEditDialog);
            }

            this._oEditDialog.open();
        },

        onDeletePress: function () {
            var oContext = this.getView().getBindingContext();
            if (!oContext) {
                return;
            }

            MessageBox.confirm("Bạn có chắc chắn muốn xóa cuốn sách này?", {
                title: "Xác nhận xóa",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oContext.delete().then(function () {
                            MessageToast.show("Đã xóa sách thành công!");
                            this.onNavBack();
                        }.bind(this)).catch(function (oError) {
                            MessageBox.error("Xóa thất bại: " + oError.message);
                        });
                    }
                }.bind(this)
            });
        }, 

    });
});