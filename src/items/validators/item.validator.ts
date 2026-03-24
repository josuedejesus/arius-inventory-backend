import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsRequiredForType(
  itemType: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isRequiredForType',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          if (obj.type === itemType) {
            return (
              value !== undefined &&
              value !== null &&
              value !== '' &&
              value !== 0
            );
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} es obligatorio para el tipo ${itemType}`;
        },
      },
    });
  };
}
