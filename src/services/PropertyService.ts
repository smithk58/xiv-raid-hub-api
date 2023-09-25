import { Singleton } from 'typescript-ioc';

import { IProperty, PropertyValue } from '../models/user-settings/IProperty';
import { ValidationError } from '../utils/errors/ValidationError';

@Singleton
export class PropertyService {
    /**
     * Loads a list of IProperty imports into a map of IProperty.key -> IProperty instance.
     * @param propertiesToLoad - A list of imported IProperties.
     */
    loadProperties(propertiesToLoad: (new () => IProperty<PropertyValue>)[]) {
        const propMap: Record<string, IProperty<PropertyValue>> = {};
        propertiesToLoad.forEach((iPropConstructor) => {
            const property = new iPropConstructor();
            propMap[property.getKey()] = property;
        });
        return propMap;
    }

    /**
     * Validates the provided list of properties against a map of property values.
     * @param properties - The list of properties to validate against.
     * @param valuesToCheck - The list of values (property key -> value) to validate.
     */
    validatePropertyValues(properties: Record<string, IProperty<PropertyValue>>, valuesToCheck: Record<string, PropertyValue>) {
        Object.keys(valuesToCheck).forEach((prop) => {
            const property = properties[prop];
            const valueToCheck = valuesToCheck[prop];
            if (!property) {
                throw new ValidationError(`Invalid property. ${prop} wasn't an expected setting. This is most likely a bug.`, prop);
            }
            const error = property.validate(valueToCheck);
            if (error) {
                throw new ValidationError(`Invalid value provided for + ${property.getLabel()}. ${error}`, property.getKey());
            }
        });
    }

    /**
     * Builds a fully resolved key -> property value map from a list of properties and existing values. Any properties missing from the
     * existingValues map will be inserted with their default value.
     * @param properties - The list of values to build a resolved map of.
     * @param existingValues - Any existing value assignments to the above properties.
     */
    resolvePropertyValueMap(properties: Record<string, IProperty<PropertyValue>>, existingValues: Record<string, string>) {
        const resolvedMap: Record<string, PropertyValue> = {};
        Object.keys(properties).forEach((key) => {
            // Assign the properties default value if we don't have an existing value, otherwise transform the existing value from a string
            // to the appropriate type for the property
            const property = properties[key];
            if (!existingValues.hasOwnProperty(key)) {
                resolvedMap[key] = property.getDefaultValue();
            } else {
                resolvedMap[key] = property.valueFromString(existingValues[key]);
            }
        });
        return resolvedMap;
    }
}
