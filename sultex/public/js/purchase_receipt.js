frappe.ui.form.on('Purchase Receipt Item', {
    bilty_weight: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let total_tare_weight = row.tare_weight * row.qty;
        let net_qty = row.bilty_weight - total_tare_weight;
        console.log(total_tare_weight);
        frappe.model.set_value(cdt, cdn, "net_qty_received", net_qty);
        frappe.model.set_value(cdt, cdn, "total_tare_weight", total_tare_weight);
        frm.refresh_field("net_qty_received","total_tare_weight");
    },
    qty: function (frm, cdt, cdn) {
        secondary_qty(frm,cdt,cdn)
        change_rate(frm,cdt,cdn)
        let row = locals[cdt][cdn];
        let total_tare_weight = row.tare_weight * row.qty;
        let net_qty = row.bilty_weight - total_tare_weight;
        frappe.model.set_value(cdt, cdn, "net_qty_received", net_qty);
        frappe.model.set_value(cdt, cdn, "total_tare_weight", total_tare_weight);
        frm.refresh_field("net_qty_received","total_tare_weight");
    },
    secondary_conversion_factor(frm,cdt,cdn){
        secondary_qty(frm,cdt,cdn)
    },
    secondary_qty(frm,cdt,cdn){
        secondary_conversion_factor(frm,cdt,cdn)
        change_rate(frm,cdt,cdn)
    },
    
})
const secondary_qty=(frm,cdt,cdn)=>{
    let row=locals[cdt][cdn]
    if(row.secondary_conversion_factor && row.qty){
        frappe.model.set_value(cdt,cdn,'secondary_qty',row.secondary_conversion_factor*row.qty)
    }

}
const secondary_conversion_factor=(frm,cdt,cdn)=>{
    let row=locals[cdt][cdn]
    if(row.secondary_qty && row.qty){
        frappe.model.set_value(cdt,cdn,'secondary_conversion_factor',row.secondary_qty/row.qty)
    }
}
const change_rate=(frm,cdt,cdn)=>{
    let row=locals[cdt][cdn]
    if(row.secondary_qty && row.qty && row.secondary_rate){
        frappe.model.set_value(cdt,cdn,'rate',row.secondary_rate/row.qty*row.secondary_qty)
    }
}