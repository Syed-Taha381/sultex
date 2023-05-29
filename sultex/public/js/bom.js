frappe.ui.form.on('Work Order', {
    bom_no: function(frm) {
        setTimeout(() => {
            for (let row of frm.doc.exploded_items) {
                if (row.item_code) {
                    frappe.call({
                        async: false,
                        method: 'sultex.events.work_order.get_uom', 
                        args: {
                            item_code: row.item_code
                        },
                        callback: function (r) {
                            if (r.message) {
                                row.uom = r.message
                            }
                        }
                    });
                }
            }    
        }, 500);
        frm.refresh_field('exploded_items')
    }
})