export interface InvoiceItem {
    label: string
    sublabel: string
    amount: number
    type: string // + - =
    currency: string
}

export interface Invoice {
    items: InvoiceItem[]
    total: InvoiceItem
}
