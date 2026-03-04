/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for LaunchCopy</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://cizdvetxjuaudafwnlpq.supabase.co/storage/v1/object/public/email-assets/logo.png"
          width="40"
          height="40"
          alt="LaunchCopy"
          style={{ marginBottom: '24px' }}
        />
        <Heading style={h1}>Confirm your new email</Heading>
        <Text style={text}>
          You requested to change your LaunchCopy email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          Didn't request this? Please secure your account immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#221F1C',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#7C7570',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const link = { color: '#221F1C', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(38, 90%, 55%)',
  color: '#111110',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#A8A29E', margin: '32px 0 0' }
