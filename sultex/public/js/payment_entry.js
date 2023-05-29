frappe.ui.form.on('Payment Entry', {
    party: function (frm, cdt, cdn) {
        if (frm.doc.party_type === 'Supplier') {
            frappe.db.get_value("Supplier", frm.doc.party, "tax_withholding_category")
                .then(r => {
                    if (r.message)
                        frappe.model.set_value(cdt, cdn, "withholding_tax_category", r.message.tax_withholding_category);
                })
        }

    },
    party_name(frm) {
        if (frm.doc.party && frm.doc.party_name)
            get_outstanding_invoice_custom(frm)
    },
    net_amount(frm) {
        add_withholding_tax_and_update_paid_amount(frm)
    },
    get_outstanding_documents_c: function(frm, filters) {
        frm.clear_table("references");

        if(!frm.doc.party) {
            return;
        }

        frm.events.check_mandatory_to_fetch(frm);
        var company_currency = frappe.get_doc(":Company", frm.doc.company).default_currency;

        var args = {
            "posting_date": frm.doc.posting_date,
            "company": frm.doc.company,
            "party_type": frm.doc.party_type,
            "payment_type": frm.doc.payment_type,
            "party": frm.doc.party,
            "party_account": frm.doc.payment_type=="Receive" ? frm.doc.paid_from : frm.doc.paid_to,
            "cost_center": frm.doc.cost_center
        }

        for (let key in filters) {
            args[key] = filters[key];
        }

        frappe.flags.allocate_payment_amount = filters['allocate_payment_amount'];

        return  frappe.call({
            method: 'sultex.events.payment_entry.get_outstanding_reference_documents',
            args: {
                args:args
            },
            callback: function(r, rt) {
                if(r.message) {
                    var total_positive_outstanding = 0;
                    var total_negative_outstanding = 0;

                    $.each(r.message, function(i, d) {
                        var c = frm.add_child("references");
                        c.reference_doctype = d.voucher_type;
                        c.reference_name = d.voucher_no;
                        c.due_date = d.due_date
                        c.total_amount = d.invoice_amount;
                        c.outstanding_amount = d.outstanding_amount;
                        c.bill_no = d.bill_no;
                        c.bill_date = d.bill_date;
                        c.payment_term = d.payment_term;
                        c.allocated_amount = d.allocated_amount;

                        if(!in_list(["Sales Order", "Purchase Order", "Expense Claim", "Fees"], d.voucher_type)) {
                            if(flt(d.outstanding_amount) > 0)
                                total_positive_outstanding += flt(d.outstanding_amount);
                            else
                                total_negative_outstanding += Math.abs(flt(d.outstanding_amount));
                        }

                        var party_account_currency = frm.doc.payment_type=="Receive" ?
                            frm.doc.paid_from_account_currency : frm.doc.paid_to_account_currency;

                        if(party_account_currency != company_currency) {
                            c.exchange_rate = d.exchange_rate;
                        } else {
                            c.exchange_rate = 1;
                        }
                        if (in_list(['Sales Invoice', 'Purchase Invoice', "Expense Claim", "Fees"], d.reference_doctype)){
                            c.due_date = d.due_date;
                        }
                    });

                    if(
                        (frm.doc.payment_type=="Receive" && frm.doc.party_type=="Customer") ||
                        (frm.doc.payment_type=="Pay" && frm.doc.party_type=="Supplier")  ||
                        (frm.doc.payment_type=="Pay" && frm.doc.party_type=="Employee") ||
                        (frm.doc.payment_type=="Receive" && frm.doc.party_type=="Student") ||
                        (frm.doc.payment_type=="Receive" && frm.doc.party_type=="Donor")
                    ) {
                        if(total_positive_outstanding > total_negative_outstanding)
                            if (!frm.doc.paid_amount)
                                frm.set_value("paid_amount",
                                    total_positive_outstanding - total_negative_outstanding);
                    } else if (
                        total_negative_outstanding &&
                        total_positive_outstanding < total_negative_outstanding
                    ) {
                        if (!frm.doc.received_amount)
                            frm.set_value("received_amount",
                                total_negative_outstanding - total_positive_outstanding);
                    }
                }

                frm.events.allocate_party_amount_against_ref_docs(frm,
                    (frm.doc.payment_type=="Receive" ? frm.doc.paid_amount : frm.doc.received_amount));

            }
        });
    },
})

const get_outstanding_invoice_custom = frm => {
    const today = frappe.datetime.get_today();
    const fields = [
        { fieldtype: "Section Break", label: __("Posting Date") },
        {
            fieldtype: "Date", label: __("From Date"),
            fieldname: "from_posting_date", default: frappe.datetime.add_months(today, -3)
        },
        { fieldtype: "Column Break" },
        { fieldtype: "Date", label: __("To Date"), fieldname: "to_posting_date", default: today },
        { fieldtype: "Section Break", label: __("Due Date") },
        { fieldtype: "Date", label: __("From Date"), fieldname: "from_due_date" },
        { fieldtype: "Column Break" },
        { fieldtype: "Date", label: __("To Date"), fieldname: "to_due_date" },
        { fieldtype: "Section Break", label: __("Outstanding Amount") },
        {
            fieldtype: "Float", label: __("Greater Than Amount"),
            fieldname: "outstanding_amt_greater_than", default: 0
        },
        { fieldtype: "Column Break" },
        { fieldtype: "Float", label: __("Less Than Amount"), fieldname: "outstanding_amt_less_than" },
        { fieldtype: "Section Break" },
        {
            fieldtype: "Link", label: __("Cost Center"), fieldname: "cost_center", options: "Cost Center",
            "get_query": function () {
                return {
                    "filters": { "company": frm.doc.company }
                }
            }
        },
        { fieldtype: "Column Break" },
        { fieldtype: "Section Break" },
        { fieldtype: "Check", label: __("Allocate Payment Amount"), fieldname: "allocate_payment_amount", default: 1 },
    ];

    frappe.prompt(fields, function (filters) {
        frappe.flags.allocate_payment_amount = true;
        frm.events.validate_filters_data(frm, filters);
        frm.doc.cost_center = filters.cost_center;
        frm.events.get_outstanding_documents_c(frm, filters);
    }, __("Filters"), __("Get Outstanding Documents"));
}

const add_withholding_tax_and_update_paid_amount = frm => {
    if (frm.doc.withholding_tax_category) {
        const tax_category = frm.doc.withholding_tax_category
        frm.doc.deductions = []
        frappe.db.get_doc('Tax Withholding Category', tax_category)
            .then(doc => {
                doc.accounts.forEach(row => {
                    if (row.company === frm.doc.company) {
                        frappe.db.get_value('Company', frm.doc.company, 'cost_center')
                            .then(r => {
                                // Get current fiscal year rate and calculate tax amount
                                const fiscal_year = frappe.boot.user.defaults.fiscal_year
                                frappe.db.get_value("Fiscal Year", fiscal_year, [""])
                                let tax_rate = 0
                                doc.rates.forEach(row => {
                                    if (row.fiscal_year === fiscal_year) {
                                        console.log(row.tax_withholding_rate)
                                        tax_rate = row.tax_withholding_rate
                                    }
                                });
                                const cost_center = r.message.cost_center
                                const tax_amount = 0.01 * tax_rate * frm.doc.net_amount
                                row = frm.add_child('deductions', {
                                    'account': row.account,
                                    'cost_center': cost_center
                                })
                                frappe.model.set_value(row.doctype, row.name, "amount", -1 * tax_amount)
                                frm.refresh_field('deductions')

                                // Updating Paid Amount
                                const paid_amount = frm.doc.net_amount - 0.01 * tax_rate * frm.doc.net_amount
                                frm.set_value('paid_amount', paid_amount)
                            })
                    }
                });
            })
    }
}