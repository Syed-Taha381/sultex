frappe.ui.form.on('Delivery Note', {
    refresh: function(frm) {
        if(frm.is_new()){
            frm.doc.items=[]
            cur_frm.refresh_field('items')
        }
        frm.add_custom_button(__('Get Sales Order Item'), function(){
            fetch_sales_order(frm)
        })
    }
});

frappe.ui.form.on('Delivery Note Item', {
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


    net_weight_per_unit: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn]
        if (row.qty && row.net_weight_per_unit) {
            frappe.model.set_value(cdt, cdn, 'total_net_weight', row.qty * row.net_weight_per_unit)
        }
        total_net_weight(frm)
    },
    gross_weight_per_unit: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn]
        if (row.qty && row.gross_weight_per_unit) {
            frappe.model.set_value(cdt, cdn, 'total_gross_weight', row.qty * row.gross_weight_per_unit)
        }
        total_gross_weight(frm)
    },
    qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn]
        if (row.qty && row.gross_weight_per_unit) {
            frappe.model.set_value(cdt, cdn, 'total_net_weight', row.qty * row.net_weight_per_unit)
            frappe.model.set_value(cdt, cdn, 'total_gross_weight', row.qty * row.gross_weight_per_unit)
        }
        total_net_weight(frm)
        total_gross_weight(frm)
        if (row.qty && row.secondary_conversion_factor) {
            secondary_qty(frm, cdt, cdn)
        }
        if (row.qty && row.secondary_conversion_factor_2) {
            secondary_qty_2(frm, cdt, cdn)
        }
    },
    total_gross_weight(frm) {
        total_gross_weight(frm)
    },
    secondary_qty(frm, cdt, cdn) {
        total_secondary_qty(frm)
        let row = locals[cdt][cdn]
        if (row.secondary_qty && frm.doc.items.length == 1) {
            frappe.model.set_value(cdt, cdn, 'to_pkg_no', row.secondary_qty)
        } else if (row.qty && frm.doc.items.length > 1) {
            frappe.model.set_value(cdt, cdn, 'to_pkg_no', parseInt(row.from_pkg_no) + parseInt(row.secondary_qty) - 1)
        }
    },
    secondary_qty_2(frm) {
        total_secondary_qty_2(frm)
    },
    items_add(frm, cdt, cdn) {
        let row = locals[cdt][cdn]
        if (frm.doc.items.length == 1) {
            frappe.model.set_value(cdt, cdn, 'from_pkg_no', 1)
        } else if (frm.doc.items.length > 1) {
            for (let itm of frm.doc.items) {
                if ((parseInt(row.idx) - 1) == itm.idx) {
                    frappe.model.set_value(cdt, cdn, 'from_pkg_no', parseInt(itm.to_pkg_no) + 1)
                }
            }
        }
    }
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
                            columns: 1
                        },
                        {
                            fieldtype: 'Float',
                            fieldname: "nw",
                            read_only: 1,
                            in_list_view: 1,
                            columns: 1,
                            label: __('Net Weight')
                        },
                        {
                            fieldtype: 'Float',
                            fieldname: "gw",
                            read_only: 1,
                            in_list_view: 1,
                            columns: 1,
                            label: __('Gross Weight')
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
                            frappe.model.set_value(cdt,cdn,'against_sales_order',frm.doc.sales_order)
                            frappe.model.set_value(cdt,cdn,'gross_weight_per_unit', row.gw);
                            frappe.model.set_value(cdt,cdn,'net_weight_per_unit', row.nw);
                            frappe.model.set_value(cdt,cdn,'total_net_weight', row.qty * row.nw);
                            frappe.model.set_value(cdt,cdn,'total_gross_weight', row.qty * row.gw);
                        }
                    }
                    
                }
                cur_frm.refresh_field('items')
                dialog.hide();
            }
        });

        frappe.call({
            async: false,
            method: "sultex.events.delivery_note.sales_inv_query_fro_sales_order",
            args: {
                sales_order : cur_frm.doc.sales_order,
                delivery_note  :cur_frm.doc.name,
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
                                    "gw": row.gross_weight_per_unit,
                                    "nw":row.net_weight_per_unit
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

const total_gross_weight = (frm) => {
    let total = 0
    for (let row of frm.doc.items) {
        if (row.total_gross_weight) {
            total += row.total_gross_weight
        }
    }
    frappe.model.set_value('Delivery Note', frm.doc.name, 'total_gross_weight', total)
}
const total_net_weight = (frm) => {
    let val = 0
    for (let row of frm.doc.items) {
        if (row.total_net_weight) {
            val += row.total_net_weight
        }
    }
    frm.doc.total_net_weight2 = val
    frm.refresh_field('total_net_weight2')
}
const total_secondary_qty = (frm) => {
    let total = 0
    for (let row of frm.doc.items) {
        if (row.secondary_qty) {
            total += row.secondary_qty
            frappe.model.set_value('Delivery Note', frm.doc.name, 'total_secondary_qty', total)
        }
    }
}
const total_secondary_qty_2 = (frm) => {
    let total = 0
    for (let row of frm.doc.items) {
        if (row.secondary_qty_2) {
            total += row.secondary_qty_2
            frappe.model.set_value('Delivery Note', frm.doc.name, 'total_secondary_qty_2', total)
        }
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
