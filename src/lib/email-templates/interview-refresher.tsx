import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  firstName?: string
  roleTitle?: string
  stage?: string
  when?: string
  reminders?: string[]
  prepUrl?: string
}

const DEFAULTS = [
  'Ask every candidate the same core questions so answers are comparable.',
  'Probe for specific examples: situation, action, result.',
  'Write evidence down before forming an overall view.',
]

const Email = ({ firstName, roleTitle, stage, when, reminders, prepUrl }: Props) => {
  const list = reminders?.length ? reminders : DEFAULTS
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Quick refresher before your ${stage ?? 'interview'}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>BENCHMARK</Text>
          <Heading style={heading}>A 60-second refresher</Heading>
          <Text style={body}>
            Hi {firstName || 'there'}, your {stage || 'interview'} for <strong>{roleTitle || 'the role'}</strong>{' '}
            starts {when ? `at ${when}` : 'soon'}. Keep these in mind:
          </Text>
          {list.map((r, i) => (
            <Text key={i} style={item}>• {r}</Text>
          ))}
          <Button style={button} href={prepUrl || 'https://usebenchmark.app/interviews'}>
            Review your preparation
          </Button>
          <Text style={muted}>You turned on refreshers in Benchmark. Switch them off in Settings → Calendar.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Starting soon: ${d.roleTitle || 'your interview'}`,
  displayName: 'Interview refresher',
  previewData: { firstName: 'Alex', roleTitle: 'Senior Engineer', stage: 'Technical interview', when: '14:00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Plus Jakarta Sans, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '520px' }
const brand = { fontSize: '12px', letterSpacing: '0.2em', color: '#6b6b6b', fontWeight: 700 }
const heading = { fontSize: '22px', color: '#0a0a0a', margin: '12px 0' }
const body = { fontSize: '15px', color: '#333333', lineHeight: '1.6' }
const item = { fontSize: '14px', color: '#333333', lineHeight: '1.5', margin: '6px 0' }
const button = { backgroundColor: '#ff6363', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', marginTop: '16px' }
const muted = { fontSize: '12px', color: '#888888', marginTop: '24px' }
