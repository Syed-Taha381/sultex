frappe.ui.form.on('Sales Invoice', {
    refresh: function(frm) {
        if(frm.doc.docstatus <= 1){
           frm.add_custom_button(__('Get Sales Order Item'), function(){
                fetch_sales_order(frm)
            })
        }
        
    }
});

frappe.ui.form.on('Sales Invoice Item', {
    item_code(frm, cdt, cdn) {
        setTimeout(() => {
            calc_gross_weight(frm, cdt, cdn)
            calc_net_weight(frm, cdt, cdn)
        }, 1000);
    },
    secondary_uom: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn]
        if (row.secondary_uom) {
            change_conversion_factor(cdt, cdn)
        } else {
            frappe.model.set_value(cdt, cdn, "secondary_conversion_factor", 0);
        }
    },
    secondary_uom_2: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn]
        if (row.secondary_uom_2) {
            change_conversion_factor_2(cdt, cdn)
        } else {
            frappe.model.set_value(cdt, cdn, "secondary_conversion_factor_2", 0);
        }
    },


    secondary_conversion_factor: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn]
        if (row.secondary_conversion_factor) {
            secondary_qty(frm, cdt, cdn)
        } else {
            frappe.model.set_value(cdt, cdn, "secondary_qty", 0);
        }
    },
    secondary_conversion_factor_2: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn]
        if (row.secondary_conversion_factor_2) {
            secondary_qty_2(frm, cdt, cdn)
        } else {
            frappe.model.set_value(cdt, cdn, "secondary_qty_2", 0);
        }
    },


    qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn]
        if (row.qty && row.secondary_conversion_factor) {
            secondary_qty(frm, cdt, cdn)
        }
        if (row.qty && row.secondary_conversion_factor_2) {
            secondary_qty_2(frm, cdt, cdn)
        }
        calc_gross_weight(frm, cdt, cdn)
        calc_net_weight(frm, cdt, cdn)
    },

    secondary_qty(frm) {
        calculate_secondary_qty(frm)
    },

    secondary_qty_2(frm) {
        calculate_secondary_qty_2(frm)
    },

    gross_weight(frm) {
        calc_total_gross_weight(frm)
    },

    net_weight(frm, cdt, cdn) {
        const row = locals[cdt][cdn]
        const rate_per_net_weight = parseFloat(row.amount) / parseFloat(row.net_weight)
        frappe.model.set_value(cdt, cdn, 'rate_per_net_weight', rate_per_net_weight)

        calc_total_net_weight(frm)
    },
})

const fetch_sales_order=(frm)=>{
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
                            in_list_view:0,
                            read_only: 1,
                            label: __('Item Code'),
                            columns: 2
                        },
                        {
                            fieldtype: 'Link',
                            fieldname: "sales_order",
                            options: 'Sales Order',
                            in_list_view:1,
                            read_only: 1,
                            label: __('Sales Order'),
                            columns: 3
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
                            in_list_view: 0,
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
                            columns: 2
                        }
                    ]
                }
            ],
            primary_action_label: 'Get Items',
            primary_action(values) {
                if (values.items) {
                    for (let row of values.items) {
                        if(row.check ==1){
                            let child = frm.add_child('items', {
                                qty: row.qty
                            });
                            let cdt = child.doctype
                            let cdn = child.name
                            frappe.model.set_value(cdt,cdn,'item_code', row.item_code);
                            frappe.model.set_value(cdt,cdn,'qty', row.qty);
                            frappe.model.set_value(cdt,cdn,'delivery_date', row.delivery_date);
                            frappe.model.set_value(cdt,cdn,'sales_order',frm.doc.sales_order)
                        }
                    }
                    
                }
                cur_frm.refresh_field('items')
                dialog.hide();
            }
        });

        frappe.call({
            async: false,
            method: "sultex.events.sales_invoice.sales_inv_query_fro_sales_order",
            args: {
                sales_order : cur_frm.doc.sales_order,
                sales_invoice  :cur_frm.doc.name,
            },
            callback: function (r) {
                if (r.message) {
                    for (let row of r.message) {
                        frappe.db.get_doc('Item', row.item_code)
                        .then(itm_doc => {
                            setTimeout(() => {
                                dialog.fields_dict.items.df.data.push({
                                    "sales_order":frm.doc.sales_order,
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
}
const change_conversion_factor = (cdt, cdn) => {
    let row = locals[cdt][cdn]
    frappe.db.get_doc('Item', row.item_code)
        .then(doc => {
            for (let item of doc.uoms) {
                if (row.secondary_uom == item.uom) {
                    frappe.model.set_value(cdt, cdn, "secondary_conversion_factor", item.conversion_factor);
                }
            }
        })
}
const change_conversion_factor_2 = (cdt, cdn) => {
    let row = locals[cdt][cdn]
    frappe.db.get_doc('Item', row.item_code)
        .then(doc => {
            for (let item of doc.uoms) {
                if (row.secondary_uom_2 == item.uom) {
                    frappe.model.set_value(cdt, cdn, "secondary_conversion_factor_2", item.conversion_factor);
                }
            }
        })
}

const secondary_qty = (frm, cdt, cdn) => {
    let row = locals[cdt][cdn]
    if (row.secondary_conversion_factor && row.qty) {
        frappe.model.set_value(cdt, cdn, 'secondary_qty', row.secondary_conversion_factor * row.qty)
    }
}

const secondary_qty_2 = (frm, cdt, cdn) => {
    let row = locals[cdt][cdn]
    if (row.secondary_conversion_factor_2 && row.qty) {
        frappe.model.set_value(cdt, cdn, 'secondary_qty_2', row.secondary_conversion_factor_2 * row.qty)
    }
}


const calculate_secondary_qty = (frm) => {
    let total = 0
    for (const row of frm.doc.items) {
        if (row.secondary_qty) {
            total += row.secondary_qty
        }
    }

    let cdt = frm.doc.doctype
    let cdn = frm.doc.name

    frappe.model.set_value(cdt, cdn, 'total_secondary_quantity', total)
}

const calculate_secondary_qty_2 = (frm) => {
    let total = 0
    for (const row of frm.doc.items) {
        if (row.secondary_qty_2) {
            total += row.secondary_qty_2
        }
    }

    let cdt = frm.doc.doctype
    let cdn = frm.doc.name

    frappe.model.set_value(cdt, cdn, 'total_secondary_quantity_2', total)
}

const calc_gross_weight = (frm, cdt, cdn) => {
    const row = locals[cdt][cdn]
    const item_code = row.item_code

    if (item_code) {
        frappe.db.get_value("Item", item_code, "gross_weight_per_unit").then(r => {
            let gross_weight_per_unit = r.message.gross_weight_per_unit
            frappe.model.set_value(cdt, cdn, "gross_weight", parseFloat(gross_weight_per_unit) * row.qty)
        })
    } else {
        frappe.model.set_value(cdt, cdn, "gross_weight", 0)
    }
}


const calc_net_weight = (frm, cdt, cdn) => {
    const row = locals[cdt][cdn]
    const item_code = row.item_code
    if (item_code) {
        frappe.db.get_value("Item", item_code, "net_weight_per_unit").then(r => {
            let net_weight_per_unit = r.message.net_weight_per_unit
            frappe.model.set_value(cdt, cdn, "net_weight", parseFloat(net_weight_per_unit) * row.qty)
        })
    } else {
        frappe.model.set_value(cdt, cdn, "net_weight", 0)
    }
}

const calc_total_gross_weight = (frm) => {
    let total = 0
    for (let row of frm.doc.items) {
        if (row.gross_weight) {
            total += row.gross_weight
        }
    }
    frappe.model.set_value('Sales Invoice', frm.doc.name, 'items_gross_weight', total)
}

const calc_total_net_weight = (frm) => {
    let total = 0
    for (let row of frm.doc.items) {
        if (row.net_weight) {
            total += row.net_weight
        }
    }
    frappe.model.set_value('Sales Invoice', frm.doc.name, 'items_net_weight', total)
}
