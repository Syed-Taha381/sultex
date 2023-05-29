frappe.ui.form.on('Work Order', {
    refresh: function (frm) {
        if (frm.doc.docstatus === 0) {
            set_custom_buttons(frm);
        }
    },
    sales_order:function(frm,dt,dn){
        if(frm.doc.sales_order){
            frappe.model.set_value('Work Order',frm.doc.name,'reference_work_order',frm.doc.sales_order)
        }
    },
    bom_no: function (frm) {
        setTimeout(() => {
            for (let row of frm.doc.required_items) {
                frappe.call({
                    async: false,
                    method: 'sultex.events.work_order.get_req_items_details',
                    args: {
                        item_code: row.item_code,
                        bom_no: frm.doc.bom_no
                    },
                    callback: function (r) {
                        if (r.message) {
                            row.uom = r.message[0];
                            row.required_qty = r.message[1] * frm.doc.qty;
                        }
                    }
                });
            }
            frm.refresh_field('required_items')
        }, 500);
    },

    production_item: function (frm) {
        frm.doc.work_order_secondary_uom = [];
        frm.refresh_field('work_order_secondary_uom')
        setTimeout(() => {
            set_secondary_uom(frm)
        }, 500);
    },

    qty: function (frm) {
        setTimeout(() => {
            set_secondary_qty(frm)
        }, 500);
    },
    planned_start_date:function(frm){
        if(frm.doc.planned_start_date){
            show_msg(frm)
        }
    },
    expected_delivery_date:function(frm){
        if(frm.doc.expected_delivery_date){
            show_msg(frm)
        }
    },
})

const show_msg=(frm)=>{
    if(frm.doc.planned_start_date && frm.doc.expected_delivery_date){
        if(frm.doc.planned_start_date > frm.doc.expected_delivery_date){
            frappe.call({
                async: false,
                method: 'sultex.events.work_order.stop_execution',
                args: {
                    planned_start_date : frm.doc.planned_start_date,
                    expected_delivery_date :frm.doc.expected_delivery_date,
                    name : frm.doc.name
                },
                callback: function (r) {
                    //on success 
                }
            });
        }
    }
};

const set_secondary_uom = (frm) => {
    const item_code = frm.doc.production_item;
    if (!item_code) return;


    frappe.call({
        method: 'sultex.events.work_order.get_secondary_uom',
        args: { item_code },
        callback: function (r) {
            const data = r.message;
            if (data) {
                for (const row of data) {
                    let child_row = frm.add_child("work_order_secondary_uom")
                    let cf = parseFloat(row.conversion_factor);
                    let qty = frm.doc.qty ? parseFloat(frm.doc.qty) : 0;
                    let secondary_qty = cf * qty;

                    child_row.uom = row.uom
                    child_row.conversion_factor = row.conversion_factor
                    child_row.qty = secondary_qty
                }

                frm.refresh_field('work_order_secondary_uom')
            }
        }
    });
}

const set_secondary_qty = (frm) => {
    if (!frm.doc.work_order_secondary_uom) return;

    for (const row of frm.doc.work_order_secondary_uom) {
        let cf = parseFloat(row.conversion_factor);
        let qty = frm.doc.qty ? parseFloat(frm.doc.qty) : 0;
        let secondary_qty = cf * qty;

        row.qty = secondary_qty
    }

    frm.refresh_field('work_order_secondary_uom')
}

const set_custom_buttons = function (frm) {
    frm.add_custom_button('Sales Order', () => {
        if (frm.doc.sales_order) {
            frm.data = []
            let dialog = new frappe.ui.Dialog({
                title: __("Sales Order Item"),
                fields: [
                    {
                        fieldname: "items", read_only: 1, label: 'Sales Order Item', fieldtype: "Table", cannot_add_rows: true, data: frm.data,
                        get_data: () => {
                            return frm.data
                        },
                        fields: [
                            {
                                fieldtype: 'Link',
                                fieldname: "item_code",
                                options: 'Item',
                                in_list_view: 1,
                                read_only: 1,
                                label: __('Item Code'),
                                columns: 2
                            },
                            {
                                fieldtype: 'Data',
                                fieldname: "item_name",
                                in_list_view: 1,
                                read_only: 1,
                                label: __('Item Name'),
                                columns: 2
                            },
                            {
                                fieldtype: 'Link',
                                fieldname: "item_group",
                                options:'Item Group',
                                in_list_view: 1,
                                read_only: 1,
                                label: __('Item Group'),
                                columns: 2
                            },
                            {
                                fieldtype: 'Link',
                                fieldname: "uom",
                                options: 'UOM',
                                in_list_view: 1,
                                read_only: 1,
                                label: __('UOM'),
                                columns: 1
                            },
                            {
                                fieldtype: 'Float',
                                fieldname: "qty",
                                read_only: 1,
                                in_list_view: 1,
                                columns: 1,
                                label: __('Qty')
                            },
                            {
                                fieldtype: 'Check',
                                fieldname: "check",
                                label: __('Select'),
                                in_list_view: 1,
                                columns: 1
                            },
                            {
                                fieldtype: 'Date',
                                fieldname: "delivery_date",
                                label: __('Delivery Date'),
                                in_list_view: 1,
                                columns: 1
                            }
                        ]
                    }
                ],
                primary_action_label: 'Get Items',
                primary_action(values) {
                    let checked = 0
                    let item = '';
                    let qty = '';
                    let d_date='';
                    let sales_order=frm.doc.sales_order;
                    
                    let work_order = '';
                    if (values.items) {
                        for (let row of values.items) {
                            if (row.check === 1) {
                                checked += 1;
                                item = row.item_code;
                                qty = row.qty;
                                work_order = row.work_order;
                                d_date=row.delivery_date
                            }
                        }
                        if (checked === 1) {
                            cur_frm.set_value('production_item', item);
                            cur_frm.set_value('qty', qty);
                            cur_frm.set_value('expected_delivery_date', d_date);
                            cur_frm.set_value('from_work_order', work_order);
                        } else if (checked > 1) {
                            frappe.msgprint('Please select only one item')
                        } else {
                            frappe.msgprint('Please select at least one item')
                        }
                    }
                    setTimeout(() => {
                        cur_frm.set_value("sales_order", sales_order) 
                    }, 2000);
                    cur_frm.refresh_fields('production_item', 'qty')
                    dialog.hide();
                }
            });

            frappe.call({
                async: false,
                method: "sultex.events.work_order.sales_order_query",
                args: {
                    sales_order : cur_frm.doc.sales_order,
                    work_order  :cur_frm.doc.name,
                    delivery_date   :cur_frm.doc.expected_delivery_date,
                },
                callback: function (r) {
                    if (r.message) {
                        for (let row of r.message) {
                            frappe.db.get_doc('Item', row.item_code)
                            .then(itm_doc => {
                                setTimeout(() => {
                                    dialog.fields_dict.items.df.data.push({
                                        "item_code": row.item_code,
                                        "item_name": row.item_name,
                                        "item_group": itm_doc.item_group,
                                        'uom':row.uom,
                                        "qty": row.qty,
                                        "delivery_date":row.delivery_date,
                                    });
                                    frm.data = dialog.fields_dict.items.df.data;
                                    dialog.fields_dict.items.grid.refresh();
                                }, 500);
                            });
                        }
                        dialog.show();
                        dialog.$wrapper.find('.modal-dialog').css("max-width", "80%");
                    }
                }
            });
        }
        else {
            frappe.msgprint('Please Select Sales Order First');
        }
    }, 'Get Item from');

    frm.add_custom_button('Work Order', () => {
        frm.data = []
        let dialog = new frappe.ui.Dialog({
            title: __("Work Order Item"),
            outerWidth: '100%',
            fields: [
                {
                    fieldname: "items", read_only: 1, label: 'Work Order Item', fieldtype: "Table", cannot_add_rows: true, data: frm.data,
                    get_data: () => {
                        return frm.data
                    },
                    fields: [
                        {
                            fieldtype: 'Link',
                            fieldname: "work_order",
                            options: 'Work Order',
                            in_list_view: 1,
                            read_only: 1,
                            label: __('Work Order'),
                            columns: 2
                        },
                        {
                            fieldtype: 'Link',
                            fieldname: "item_code",
                            options: 'Item',
                            in_list_view: 1,
                            read_only: 1,
                            label: __('Item Code'),
                            columns: 2
                        },
                        {
                            fieldtype: 'Data',
                            fieldname: "item_name",
                            in_list_view: 1,
                            read_only: 1,
                            label: __('Item Name'),
                            columns: 2
                        },
                        {
                            fieldtype: 'Link',
                            fieldname: "item_group",
                            options: 'Item Group',
                            in_list_view: 1,
                            read_only: 1,
                            label: __('Item Group'),
                            columns: 1
                        },
                        {
                            fieldtype: 'Float',
                            fieldname: "qty",
                            read_only: 1,
                            in_list_view: 1,
                            columns: 1,
                            label: __('Qty')
                        },
                        {
                            fieldtype: 'Check',
                            fieldname: "check",
                            label: __('Select'),
                            in_list_view: 1,
                            columns: 1
                        }]
                }
            ],
            primary_action_label: 'Get Items',
            primary_action(values) {
                let checked = 0
                let item = '';
                let qty = '';
                let uom='';
                let item_group='';
                let work_order = '';
                if (values.items) {
                    for (let row of values.items) {
                        if (row.check === 1) {
                            checked += 1;
                            item = row.item_code;
                            uom=row.uom;
                            item_group=row.item_group;
                            qty = row.qty;
                            work_order = row.work_order;
                        }
                    }
                    if (checked === 1) {
                        cur_frm.set_value('production_item', item);
                        cur_frm.set_value('qty', qty);
                        cur_frm.set_value('from_work_order', work_order);
                    } else if (checked > 1) {
                        frappe.msgprint('Please select only one item')
                    } else {
                        frappe.msgprint('Please select at least one item')
                    }
                }
                cur_frm.refresh_fields('production_item', 'qty', 'from_work_order')
                dialog.hide();
            }
        });
        frappe.call({
            async: false,
            method: "sultex.events.work_order.work_order_query",
            callback: function (r) {
                if (r.message) {
                    for (let row of r.message) {
                        frappe.db.get_doc('Item', row.item_code)
                        .then(itm_doc => {
                            if(!itm_doc.is_purchase_item){
                                dialog.fields_dict.items.df.data.push({
                                    "work_order": row.parent,
                                    "item_code": row.item_code,
                                    "item_name": row.item_name,
                                    "item_group": itm_doc.item_group,
                                    "qty": row.required_qty
                                });
                                frm.data = dialog.fields_dict.items.df.data;
                                dialog.fields_dict.items.grid.refresh();
                            }
                        })
                        
                    }
                    dialog.show();
                    dialog.$wrapper.find('.modal-dialog').css("width", "80%");
                }
            }
        });
    }, 'Get Item from');


    // frm.add_custom_button('Work Order', () => {
    //     new frappe.ui.form.MultiSelectDialog({
    //       doctype: "Work Order",
    //       target: cur_frm,
    //       setters: {
    //           company: frm.doc.company,
    //           qty: frm.doc.qty
    //       },
    //       date_field: "creation",
    //       get_query() {
    //           return {
    //               filters: { docstatus: 1 }
    //           }
    //       },
    //       action(selections) {
    //           if (selections.length === 1) {
    //               frappe.call('sultex.events.work_order.fetch_items_from_work_order', {'work_order': selections})
    //               .then( r => {
    //                   if (r.message) {
    //                       frm.set_value('production_item', r.message.item);
    //                       frm.set_value('qty', r.message.qty);
    //                   }
    //                   frm.refresh_fields('production_item', 'qty')
    //               })
    //           } else {
    //               frappe.msgprint('Must Select one Work Order')
    //           }
    //           cur_dialog.hide();
    //       }
    //   });
    // }, 'Get Item from')
}