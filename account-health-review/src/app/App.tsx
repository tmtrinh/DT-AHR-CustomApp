import React, {useState} from "react";
import { useForm } from 'react-hook-form';
import { AppHeader, AppName, Page, Flex, Code, Heading, Paragraph, Text, Button, FormField, TextInput  } from "@dynatrace/strato-components-preview";
import { Form } from "react-router-dom";
import { Environment } from "./components/Environment";

export const App = () => {
  return (
    <Page>
      <Page.Header>
        <AppHeader>
          <AppName />
        </AppHeader>
      </Page.Header>
      <Page.Main>
        <Flex padding={16} flexDirection="column">
          <Heading level={1}>Account Health Review</Heading>
          <Environment />
        </Flex>
      </Page.Main>
    </Page>
  );
};
