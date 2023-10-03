import React, {useContext, useRef, useState} from "react";
import { useForm } from 'react-hook-form';
import { AppHeader, AppName, Page, Flex, Code, Heading, Paragraph, Text, Button, FormField, TextInput  } from "@dynatrace/strato-components-preview";
import { Form } from "react-router-dom";
import { Questionnaire } from "./Questionnaire";

//Documentation: https://developer.dynatrace.com/reference/design-system/preview/forms/TextInput/

type EnvForm = {
  env: string | null;
};


let globalEnv = '';

export const Environment = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: {isSubmitSuccessful, errors},
    reset,
  } = useForm<EnvForm>({
    mode: 'all',
  });

  const [env, setEnv] = useState('');
  return (
    <form 
      onSubmit={handleSubmit(() => void 0)}
      onReset={() => reset()}
      noValidate
    >
      <Flex flexDirection="column" gap={16}>
        <FormField label="Environment ID" required>
          <TextInput 
            placeholder="Enter the Envionment ID (SaaS only, no sprint tenant)" 
            controlState={{
              state: errors.env ? 'error' : 'valid',
              hint:
                errors.env?.message ||
                'Please enter the 8-digit SaaS environment ID',
            }}
            value={env}
            {...register('env', {
              required: {
                value: true,
                message: 'Please enter the environment ID',
              },
              minLength: {
                value: 8,
                message: 'The environment ID cannot have less than 8 characters',
              },
              maxLength: {
                value: 8,
                message: 'The environment ID cannot have more than 8 characters',
              },
              pattern: {
                value: /(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+/,
                message: 'The username must contain 3 alphabetical characters followed by 5 numbers',
              },
            })}
            onChange={(value) => {
              setEnv(value);
              setValue('env', value, { shouldValidate: true });
            }}
            />
        </FormField>
        <Button type="submit" variant="emphasized" onClick={() => {
          globalEnv = env;
        }}>
          Check
        </Button>
        {isSubmitSuccessful && (
          <Text>
            Checking tenant {globalEnv} ...
          </Text>
          )}
      </Flex>
    </form>
  );
};
/*
if (globalEnv != ''){
  export const TENANT = globalEnv;
  console.log(TENANT);
  export const LIVE_URL = `https://${TENANT}.live.dynatrace.com/`;
  export const APPS_URL = `https://${TENANT}.apps.dynatrace.com/`;
}
*/