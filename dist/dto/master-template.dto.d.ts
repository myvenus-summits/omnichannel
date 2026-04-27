export declare class ImportMasterTemplateDto {
    clinicId: number;
    twilioSid: string;
    name: string;
    category: string;
    variableMapping?: Record<string, string>;
}
export declare class DeployMasterTemplateDto {
    clinicIds: number[];
}
export declare class UpdateVariableMappingDto {
    variableMapping: Record<string, string>;
}
//# sourceMappingURL=master-template.dto.d.ts.map