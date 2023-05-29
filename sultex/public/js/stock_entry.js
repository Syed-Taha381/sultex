frappe.ui.form.on('Stock Entry', {
    refresh: function (frm) {
        if (!frm.doc.docstatus) {
            frm.trigger('validate_purpose_consumption');
            frm.add_custom_button(__('Create Purchase Order'), function () {
                frappe.model.with_doctype('Purchase Order', function () {
                    var po = frappe.model.get_new_doc('Purchase Order');
                    var items = frm.get_field('items').grid.get_selected_children();
                    if (!items.length) {
                        items = frm.doc.items;
                    }
                    frappe.model.set_value('Purchase Order',po.name,'schedule_date',frm.doc.required_date)
                    frappe.model.set_value('Purchase Order',po.name,'from_work_order',frm.doc.work_order)
                    frappe.model.set_value('Purchase Order',po.name,'wo_tracking_id',frm.doc.wo_tracking_id)
                    items.forEach(function (item) {
                        var po_item = frappe.model.add_child(po, 'items');
                        po_item.price_list_rate = item.basic_rate;
                        po_item.rate = item.basic_rate;
                        console.log(po_item.price_list_rate);
                        po_item.item_code = item.item_code;
                        po_item.item_name = item.item_name;
                        po_item.item_group = item.item_group;
                        po_item.stock_uom = item.stock_uom;
                        po_item.qty = item.qty;
                        po_item.uom = item.uom;
                        po_item.amount = item.amount;
                        po_item.serial_no = item.serial_no;
                        po_item.conversion_factor = item.conversion_factor;
                        po_item.description = item.description;
                        po_item.image = item.image;
                        po_item.warehouse = item.s_warehouse;
                    });
                    frappe.set_route('Form', 'Purchase Order', po.name);
                });
            });
        }
    },
    onload:function(frm){
        if(frm.doc.work_order){
            frappe.db.get_value('Work Order',frm.doc.work_order , 'expected_delivery_date')
            .then(r => {
                frappe.model.set_value('Stock Entry',frm.doc.name,'required_date',r.message.expected_delivery_date)
            })
        }
    }
}),
frappe.ui.form.on('Stock Entry', {
    refresh: function (frm) {
        if (!frm.doc.docstatus) {
            frm.trigger('validate_purpose_consumption');
            frm.add_custom_button(__('Create Purchase Receipt'), function () {
                frappe.model.with_doctype('Purchase Receipt', function () {
                    var pr = frappe.model.get_new_doc('Purchase Receipt');
                    var items = frm.get_field('items').grid.get_selected_children();
                    if (!items.length) {
                        items = frm.doc.items;
                    }
                    frappe.model.set_value('Purchase Receipt',pr.name,'from_work_order',frm.doc.work_order)
                    frappe.model.set_value('Purchase Receipt',pr.name,'wo_tracking_id',frm.doc.wo_tracking_id)
                    items.forEach(function (item) {
                        var pr_item = frappe.model.add_child(pr, 'items');
                        pr_item.item_code = item.item_code;
                        pr_item.item_name = item.item_name;
                        pr_item.description = item.description;
                        pr_item.image_view = item.image;
                        pr_item.received_qty = item.qty;
                        pr_item.uom = item.uom;
                        pr_item.stock_uom = item.stock_uom;
                        pr_item.conversion_factor = item.conversion_factor;
                        pr_item.price_list_rate = item.basic_rate;
                        pr_item.rate = item.basic_rate;
                        pr_item.amount = item.amount;
                        console.log(pr_item.amount);
                        pr_item.serial_no = item.serial_no;
                        pr_item.batch_no = item.batch_no;
                        // pr_item.item_group = item.item_group;
                        // pr_item.warehouse = item.s_warehouse;
                    });
                    frappe.set_route('Form', 'Purchase Receipt', pr.name);
                });
            });
        }
    }
})