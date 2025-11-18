import { DateRange } from "react-day-picker";

export type ReportState = {
  [key: string]: any;
};

const initialFromDate = new Date();
const initialToDate = new Date();
initialFromDate.setMonth(initialFromDate.getMonth() - 1);


export const initialReportState: ReportState = {
  // Header
  title: 'Energy Bill Audit Report',
  subTitle: 'Cost audit & verification of electricity bills (MSEDCL & Open Access)',
  clientName: 'Client Name',
  clientLocation: 'Nagpur',
  reportTags: 'MSEDCL • OA',
  period: {
    from: initialFromDate,
    to: initialToDate,
  } as DateRange,
  
  // Meta
  logo: null,
  consumer: 'Client Site / Name',
  reportType: 'Audit & Trend Analysis',
  generatedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
  preparedBy: 'Mrutyunjay Chinchole',

  // Conclusion
  conclusion: 'Write final conclusions here… Use <span class="text-green-600 font-semibold">green</span> for positives and <span class="text-red-600 font-semibold">red</span> for issues.',

  // Summary KPIs
  'kpi-avg-kwh-title': 'Average MSEDCL kWh (range)',
  'kpi-avg-kwh-value': '—',
  'kpi-avg-kwh-hint': 'Set values from your sheet',
  'kpi-avg-kvah-title': 'Average kVAh (range)',
  'kpi-avg-kvah-value': '—',
  'kpi-avg-kvah-hint': 'Set values from your sheet',
  'kpi-pf-status-title': 'Power Factor Status',
  'kpi-pf-status-value': '≥ 0.95',
  'kpi-pf-status-hint': 'No PF incentive/penalty',
  'kpi-load-factor-title': 'Load Factor',
  'kpi-load-factor-value': 'Low',
  'kpi-load-factor-hint': 'Improve utilisation by flattening peaks',

  // Image slots and remarks
  'summary-consumption': null,
  'summary-consumption-remarks': 'Summary consumption remarks…',
  'summary-kvah': null,
  'summary-kvah-remarks': 'KVAH trend remarks…',
  'summary-oa-cd': null,
  'summary-oa-cd-remarks': 'OA CD remarks…',
  'summary-cd-bd-hrd': null,
  'summary-cd-bd-hrd-remarks': 'CD/BD/HRD remarks…',
  'a-dc': null,
  'a-dc-remarks': 'DC analysis & notes…',
  'a-penalty': null,
  'a-penalty-remarks': 'Penalty observations…',
  'a-ec': null,
  'a-ec-remarks': 'EC trend commentary…',
  'a-tod-cons': null,
  'a-tod-cons-remarks': 'TOD remarks (time-slot specifics removed)…',
  'a-tod-tariff': null,
  'a-tod-tariff-remarks': 'TOD tariff notes…',
  'a-tod-ref1': null,
  'a-tod-ref2': null,
  'a-pf': null,
  'a-lf': null,
  'a-pf-lf-remarks': 'Single remarks for both PF and LF…',
  'a-bcr': null,
  'a-icr': null,
  'a-bcr-icr-remarks': 'Remarks for BCR & ICR…',
  'a-fac': null,
  'a-fac-remarks': 'FAC verification notes…',
  'a-wc': null,
  'a-wc-remarks': 'WC observations…',
  'a-tax1': null,
  'a-tax2': null,
  'a-taxes-remarks': 'Remarks for Taxes & Duties…',
  'a-adj': null,
  'a-adj-remarks': 'Adjustment reconciliation notes…',
  'a-total': null,
  'a-total-remarks': 'Explain any variances…',
  'b-oa-consumption': null,
  'b-oa-charges': null,
  'b-oa-energy-remarks': 'Remarks for OA energy consumption & charges…',
  'b-oa-other1': null,
  'b-oa-other2': null,
  'b-oa-other3': null,
  'b-oa-other-remarks': 'Common remarks for OA other charges…',
  'b-oa-tax1': null,
  'b-oa-tax2': null,
  'b-oa-tax-remarks': 'Remarks for OA taxes & duties…',
  'b-oa-total': null,
  'b-oa-total-remarks': 'Total OA commentary…',
  'b-oa-contr': null,
  'b-oa-contr-remarks': 'Contribution split insights…',
};
