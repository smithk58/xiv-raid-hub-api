import { IProperty } from '../IProperty';

export class AllowAddToRaidGroup implements IProperty<boolean> {
    static key = 'allowAddToRaidGroup';
    defaultValue = true;
    label = 'Allow Add to Raid Group';
    getKey() {
        return AllowAddToRaidGroup.key;
    }
    getLabel() {
        return this.label;
    }
    validate(value: any) {
        if (typeof(value) !== 'boolean') {
            return 'Expected boolean value.';
        }
        return undefined;
    }
    isDefault(value: boolean) {
        return value === this.defaultValue;
    }
    getDefaultValue(): boolean {
        return this.defaultValue;
    }

    valueFromString(value: string): boolean {
        return value === 'true';
    }

    valueToString(value: boolean): string {
        return value ? 'true' : 'false';
    }
}
