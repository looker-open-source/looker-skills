export interface LookerLink {
  label: string;
  url: string;
  type?: string;
  [key: string]: unknown;
}

export interface LookerCell {
  value: string | number | boolean | null | undefined;
  rendered?: string;
  html?: string;
  links?: LookerLink[];
  [key: string]: unknown;
}

export interface LookerRow {
  [fieldId: string]: LookerCell;
}

export type LookerChartData = LookerRow[];

export interface LookerDimensionField {
  name: string;
  label: string;
  label_short?: string;
  type?: string;
  [key: string]: unknown;
}

export interface LookerMeasureField {
  name: string;
  label: string;
  label_short?: string;
  type?: string;
  value_format?: string | null;
  [key: string]: unknown;
}

export interface LookerQueryFields {
  dimensions?: LookerDimensionField[];
  measures?: LookerMeasureField[];
  measure_like?: LookerMeasureField[];
  [key: string]: unknown;
}

export interface LookerQueryPivot {
  key: string;
  is_total?: boolean;
  data?: Record<string, string>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LookerQueryResponse {
  fields: LookerQueryFields;
  pivots?: LookerQueryPivot[];
  [key: string]: unknown;
}

export interface LookerChartConfig {
  backgroundColor?: string;
  textColor?: string;
  showLabels?: boolean;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  fillOpacity?: number;
  gridlines?: boolean;
  [key: string]: unknown;
}

export interface LookerVisualizationDetails {
  [key: string]: unknown;
}
