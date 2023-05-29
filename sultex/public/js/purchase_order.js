frappe.ui.form.on('Purchase Order', {
    transaction_date:function(frm){
        if(frm.doc.transaction_date){
            show_msg(frm)
        }
    },
    schedule_date:function(frm){
        if(frm.doc.schedule_date){
            show_msg(frm)
        }
    },
    supplier:function(frm){
        if(frm.doc.supplier){
            console.log('working');
            frappe.db.get_value('Supplier', frm.doc.supplier, 'purchase_taxes_and_charges_template')
            .then(r => {
                console.log(r.message.purchase_taxes_and_charges_template);
                frappe.model.set_value('Purchase Order',frm.doc.name,'taxes_and_charges',r.message.purchase_taxes_and_charges_template)
            })
            frm.refresh_field('taxes_and_charges')
        }
    }
});

frappe.ui.form.on('Purchase Order Item', {
    item_code: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn]

        frappe.db.get_value("Item", row.item_code, "terms_and_conditions").then((r) => {
            let terms_and_conditions = r.message.terms_and_conditions;
            frappe.model.set_value(frm.doc.doctype, frm.doc.name, "tc_name", terms_and_conditions);
        })
        frm.refresh();
        if(row.secondary_uom){
            change_conversion_factor(cdt,cdn);
        }else{
            frappe.model.set_value(cdt, cdn, "secondary_conversion_factor", 0);      
        }
    },
    uom:function(frm, cdt, cdn){
        let row = locals[cdt][cdn]
        if(row.secondary_uom){
            change_conversion_factor(cdt,cdn);
        }else{
            frappe.model.set_value(cdt, cdn, "secondary_conversion_factor", 0);      
        }
    },
    secondary_uom:function(frm, cdt, cdn){
        let row = locals[cdt][cdn]
        if(row.secondary_uom){
            change_conversion_factor(cdt,cdn);
        }else{
            frappe.model.set_value(cdt, cdn, "secondary_conversion_factor", 0);      
        }
    },
    qty(frm,cdt,cdn){
        secondary_qty(frm,cdt,cdn)
    },
    rate(frm,cdt,cdn){
        secondary_rate(frm,cdt,cdn)
    },
    secondary_conversion_factor(frm,cdt,cdn){
        secondary_qty(frm,cdt,cdn)
        secondary_rate(frm,cdt,cdn)
    },
    secondary_qty(frm,cdt,cdn){
        secondary_conversion_factor(frm,cdt,cdn)
    }
});


const change_conversion_factor=(cdt,cdn)=>{
    let row = locals[cdt][cdn]
    frappe.db.get_doc('Item', row.item_code)
    .then(doc => {
        for(let item of doc.uoms){
            if(row.secondary_uom == item.uom){
                frappe.model.set_value(cdt, cdn, "secondary_conversion_factor", item.conversion_factor);   
            }
        }
    })
}

const show_msg=(frm)=>{
    if(frm.doc.schedule_date && frm.doc.transaction_date){
        console.log(frm.doc.transaction_date);
        if(frm.doc.transaction_date > frm.doc.schedule_date){
            
            frappe.msgprint({
                title: __('Notification'),
                indicator: 'orange',
                message: __('Please  make sure that Required Date is correct')
            });
        }
    }
}
const secondary_qty=(frm,cdt,cdn)=>{
    let row=locals[cdt][cdn]
    if(row.secondary_conversion_factor && row.qty){
        frappe.model.set_value(cdt,cdn,'secondary_qty',row.secondary_conversion_factor*row.qty)
    }

}
const secondary_rate=(frm,cdt,cdn)=>{
    let row=locals[cdt][cdn]
    if(row.secondary_conversion_factor && row.rate){
        row.secondary_rate=row.amount/row.secondary_qty
    }
    frm.refresh_fields('items')
}
const secondary_conversion_factor=(frm,cdt,cdn)=>{
    let row=locals[cdt][cdn]
    if(row.secondary_qty && row.qty){
        frappe.model.set_value(cdt,cdn,'secondary_conversion_factor',row.secondary_qty/row.qty)
    }

}
