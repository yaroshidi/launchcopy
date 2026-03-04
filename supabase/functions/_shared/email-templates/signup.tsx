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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to LaunchCopy — verify your email to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://cizdvetxjuaudafwnlpq.supabase.co/storage/v1/object/public/email-assets/logo.png"
          width="40"
          height="40"
          alt="LaunchCopy"
          style={{ marginBottom: '24px' }}
        />
        <Heading style={h1}>Welcome aboard ✦</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>LaunchCopy</strong>
          </Link>
          . Your repo already has a story — we're here to help you tell it.
        </Text>
        <Text style={text}>
          Verify your email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Get Started
        </Button>
        <Text style={footer}>
          Didn't create an account? You can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
