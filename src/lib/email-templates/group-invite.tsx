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
  groupName?: string
  inviterName?: string
  joinUrl?: string
}

const Email = ({ groupName, inviterName, joinUrl }: Props) => {
  const group = groupName || 'a Benchmark group'
  const inviter = inviterName || 'A group lead'
  const url = joinUrl || 'https://usebenchmark.app/auth'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${inviter} invited you to ${group} on Benchmark`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>BENCHMARK</Text>
          <Heading style={heading}>You&rsquo;re invited to {group}</Heading>
          <Text style={body}>
            {inviter} invited you to join {group} on Benchmark — weekly
            three-question hiring simulations that take about two minutes, with XP,
            streaks and a group leaderboard.
          </Text>
          <Section style={{ margin: '28px 0' }}>
            <Button style={button} href={url}>
              Accept invite
            </Button>
          </Section>
          <Text style={muted}>
            Sign up with this email address and your invite will be waiting for you.
          </Text>
          <Hr style={hr} />
          <Text style={muted}>
            If you weren&rsquo;t expecting this invitation, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `You're invited to ${data['groupName'] || 'a group'} on Benchmark`,
  displayName: 'Group invite',
  previewData: {
    groupName: 'Talent Acquisition EMEA',
    inviterName: 'Abhay',
    joinUrl: 'https://usebenchmark.app/auth',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = {
  fontSize: '12px',
  letterSpacing: '2px',
  fontWeight: 700,
  color: '#6366f1',
  margin: '0 0 20px',
}
const heading = {
  fontSize: '26px',
  fontWeight: 700,
  letterSpacing: '-0.5px',
  color: '#0b0b0d',
  margin: '0 0 14px',
}
const body = { fontSize: '15px', lineHeight: '26px', color: '#3f3f46', margin: '0' }
const button = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  borderRadius: '10px',
  padding: '13px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
const muted = { fontSize: '13px', lineHeight: '22px', color: '#71717a', margin: '0' }
const hr = { borderColor: '#e4e4e7', margin: '24px 0' }
