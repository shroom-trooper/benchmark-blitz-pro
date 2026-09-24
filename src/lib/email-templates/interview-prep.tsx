import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  firstName?: string
  roleTitle?: string
  stage?: string
  when?: string
  prepUrl?: string
}

const Email = ({ firstName, roleTitle, stage, when, prepUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Your preparation for ${roleTitle ?? 'your interview'} is ready`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>BENCHMARK</Text>
        <Heading style={heading}>Your interview preparation is ready</Heading>
        <Text style={body}>
          Hi {firstName || 'there'}, you have a <strong>{stage || 'interview'}</strong> for{' '}
          <strong>{roleTitle || 'an open role'}</strong> on {when || 'soon'}. We’ve built four to six
          short scenarios around it — about four minutes.
        </Text>
        <Button style={button} href={prepUrl || 'https://usebenchmark.app/interviews'}>
          Start preparation
        </Button>
        <Text style={muted}>
          You’re receiving this because you turned on preparation emails in Benchmark. You can switch
          them off in Settings → Calendar.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Prepare for your ${d.stage || 'interview'}: ${d.roleTitle || 'upcoming interview'}`,
  displayName: 'Interview preparation',
  previewData: { firstName: 'Alex', roleTitle: 'Senior Engineer', stage: 'Technical interview', when: 'Tue 3 Oct, 14:00', prepUrl: 'https://usebenchmark.app/interviews' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Plus Jakarta Sans, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '520px' }
const brand = { fontSize: '12px', letterSpacing: '0.2em', color: '#6b6b6b', fontWeight: 700 }
const heading = { fontSize: '22px', color: '#0a0a0a', margin: '12px 0' }
const body = { fontSize: '15px', color: '#333333', lineHeight: '1.6' }
const button = { backgroundColor: '#ff6363', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }
const muted = { fontSize: '12px', color: '#888888', marginTop: '24px' }
