export type PropertyValue = string | number | boolean;
export interface IProperty<T extends PropertyValue> {
    getKey: () => string;
    getLabel: () => string;
    getDefaultValue: () => T;
    isDefault: (value: T) => boolean;
    validate: (value: PropertyValue) => string;
    valueToString: (value: T) => string;
    valueFromString: (value: string) => T;
}
