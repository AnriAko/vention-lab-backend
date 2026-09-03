export class ExcelValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExcelValidationError';
    }
}
