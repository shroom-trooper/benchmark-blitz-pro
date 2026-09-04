import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  firstName?: string
  weekNumber?: number
  topic?: string
  streak?: number
  sessionUrl?: string
}

const Email = ({ firstName, weekNumber, topic, streak, sessionUrl }: Props) => {
  const name = firstName || 'there'
  const week = weekNumber || 1
  const title = topic || 'this week’s hiring simulation'
  const url = sessionUrl || `https://usebenchmark.app/session/${week}`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Week ${week} is unlocked: ${title}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>BENCHMARK</Text>
          <Heading style={heading}>Week {week} is unlocked</Heading>
          <Text style={body}>
            Hi {name}, your next training week is ready: <strong>{title}</strong>.
            Three scenarios, roughly four minutes, and it keeps your streak alive.
          </Text>
          {streak ? (
            <Text style={body}>
              You&rsquo;re on a {streak}-week streak — don&rsquo;t break it now.
            </Text>
          ) : null}
          <Section style={{ margin: '28px 0' }}>
            <Button style={button} href={url}>
              Start week {week}
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={muted}>
            You receive this email once a week when a new training week unlocks on your
            Benchmark account.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#050505', margin: 0, padding: '32px 0' }
const container = {
  backgroundColor: '#0d0d0f',
  border: '1px solid #1f1f23',
  borderRadius: '14px',
  margin: '0 auto',
  maxWidth: '520px',
  padding: '32px',
}
const brand = {
  color: '#8b5cf6',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '12px',
  letterSpacing: '2px',
  margin: '0 0 16px',
}
const heading = {
  color: '#f1f5f9',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '24px',
  fontWeight: 700,
  margin: '0 0 12px',
}
const body = {
  color: '#94a3b8',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
}
const muted = {
  color: '#64748b',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '12px',
  lineHeight: '20px',
  margin: 0,
}
const button = {
  backgroundColor: '#8b5cf6',
  borderRadius: '10px',
  color: '#ffffff',
  display: 'inline-block',
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 22px',
  textDecoration: 'none',
}
const hr = { borderColor: '#1f1f23', margin: '24px 0' }

export const template: TemplateEntry = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Week ${data['weekNumber'] ?? 1} unlocked — ${data['topic'] ?? 'your next hiring simulation'}`,
  displayName: 'Weekly unlock reminder',
  previewData: {
    firstName: 'Alex',
    weekNumber: 2,
    topic: 'Writing role scorecards that predict performance',
    streak: 1,
  },
}
