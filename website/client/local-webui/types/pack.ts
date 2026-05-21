export type PackFormat = 'xml' | 'markdown' | 'plain';

export interface PackOptions {
  format: PackFormat;
  removeComments: boolean;
  removeEmptyLines: boolean;
  showLineNumbers: boolean;
  fileSummary: boolean;
  directoryStructure: boolean;
  includePatterns: string;
  ignorePatterns: string;
  outputParsable: boolean;
  compress: boolean;
}

export type PackRequestOptions = Omit<PackOptions, 'format' | 'includePatterns' | 'ignorePatterns'> & {
  includePatterns?: string;
  ignorePatterns?: string;
};

export const DEFAULT_PACK_OPTIONS: PackOptions = {
  format: 'xml',
  removeComments: false,
  removeEmptyLines: false,
  showLineNumbers: false,
  fileSummary: true,
  directoryStructure: true,
  includePatterns: '',
  ignorePatterns: '',
  outputParsable: false,
  compress: false,
};
