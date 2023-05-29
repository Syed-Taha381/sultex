frappe.ui.form.on('Purchase Invoice', {
	supplier: function(frm) {

		// Do not update if inter company reference is there as the details will already be updated
		if(frm.updating_party_details || frm.doc.inter_company_invoice_reference)
			return;

		erpnext.utils.get_party_details(frm, "erpnext.accounts.party.get_party_details",
			{
				posting_date: frm.doc.posting_date,
				bill_date: frm.doc.bill_date,
				party: frm.doc.supplier,
				party_type: "Supplier",
				account: frm.doc.credit_to,
				price_list: frm.doc.buying_price_list,
				fetch_payment_terms_template: cint(!frm.doc.ignore_default_payment_terms_template)
			}, function() {
				//apply_pricing_rule();
				
				frm.doc.apply_tds = 0;
				frm.doc.tax_withholding_category = frm.supplier_tds;
				frm.set_df_property("apply_tds", "read_only", frm.supplier_tds ? 0 : 1);
				frm.set_df_property("tax_withholding_category", "hidden", frm.supplier_tds ? 0 : 1);
			})
	},
})