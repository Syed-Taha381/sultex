frappe.ui.form.on('Sales Order', {
    po_no: function (frm) {
        //    console.log(frm.doc);
        for (let row of frm.doc.items){
            let dt=row.doctype;
            let dn=row.name;
            frappe.model.set_value(dt,dn,'customer_purchase_order_no',frm.doc.po_no)
        }
    },

})

frappe.ui.form.on('Sales Order Item', {
    item_code: function (frm, cdt, cdn) {
        let po_no = frm.doc.po_no
        frappe.model.set_value(cdt, cdn, "customer_purchase_order_no", po_no)
    },

})