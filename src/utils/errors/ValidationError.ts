import { ApplicationError } from './ApplicationError';

export class ValidationError extends ApplicationError {
    property: string;
    constructor(message: string, property?: string) {
        super(message, 400);
        this.property = property;
    }
}
