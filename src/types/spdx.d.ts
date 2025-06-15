export interface SPDXDocument {
  spdxVersion: string;
  dataLicense: string;
  SPDXID: string;
  name: string;
  documentNamespace: string;
  creationInfo: {
    created: string;
    creators: string[];
  };
  packages: Package[];
  files?: unknown[];
  relationships?: Relationship[];
}
export interface Package {
  name: string;
  SPDXID: string;
  versionInfo?: string;
  downloadLocation: string;
  licenseConcluded?: string;
  licenseDeclared?: string;
  copyrightText?: string;
  checksums?: Checksum[];
  externalRefs?: ExternalRef[];
}
export interface Checksum {
  algorithm: string;
  checksumValue: string;
}
export interface ExternalRef {
  referenceCategory: string;
  referenceLocator: string;
  referenceType: string;
}
export interface PerformanceMetrics {
  parseTime: number;
  fileSize: number;
}
export interface Relationship {
  spdxElementId: string;
  relatedSpdxElement: string;
  relationshipType: string;
}
