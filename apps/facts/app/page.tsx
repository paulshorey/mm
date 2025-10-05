'use client'

import { useState } from 'react'
import { TextInput, Textarea, Button, Group, Box, Text, Title, Paper, Alert } from '@mantine/core'
import { IconMail, IconUser, IconAlertCircle, IconCheck } from '@tabler/icons-react'

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setStatus('success')
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      setStatus('error')
      setErrorMessage('Failed to send message. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Paper
        shadow="xl"
        p={{ base: 'md', sm: 'xl' }}
        radius="lg"
        className="w-full max-w-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Coming Soon Badge */}
        <Box className="text-center mb-6">
          <Text
            size="sm"
            fw={700}
            className="inline-block px-4 py-1 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            COMING SOON
          </Text>
        </Box>

        {/* Main Title */}
        <Title
          order={1}
          className="text-center mb-4"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
          }}
        >
          Facts.News
        </Title>

        {/* Subtitle */}
        <Text
          size="lg"
          className="text-center mb-8 text-gray-700 leading-relaxed"
          style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)' }}
        >
          No nonsense. No pandering to political affiliations. Down to business lists of facts,
          events, statistics, for your information, to share with whomever needs to know.
        </Text>

        {/* Contact Section */}
        <Box className="mt-8">
          <Title order={3} className="text-center mb-2" style={{ color: '#667eea' }}>
            Contact Me
          </Title>
          <Text size="sm" className="text-center mb-6 text-gray-600">
            I want to make the world a more intelligent and less corrupt place, but don't have time
            or money to work on it. Would you like to collaborate? What's your vision?
          </Text>

          {/* Success Message */}
          {status === 'success' && (
            <Alert
              icon={<IconCheck size={16} />}
              title="Message sent!"
              color="green"
              mb="md"
              onClose={() => setStatus('idle')}
              withCloseButton
            >
              Thank you for reaching out. I'll get back to you soon!
            </Alert>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
              mb="md"
              onClose={() => setStatus('idle')}
              withCloseButton
            >
              {errorMessage}
            </Alert>
          )}

          {/* Contact Form */}
          <form onSubmit={handleSubmit}>
            <TextInput
              label="Your Name"
              placeholder="Enter your name"
              required
              mb="md"
              leftSection={<IconUser size={16} />}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={status === 'loading'}
            />

            <TextInput
              label="Your Email"
              placeholder="your@email.com"
              required
              type="email"
              mb="md"
              leftSection={<IconMail size={16} />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={status === 'loading'}
            />

            <Textarea
              label="Your Message"
              placeholder="Tell me about your vision for a more intelligent world..."
              required
              minRows={4}
              mb="md"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              disabled={status === 'loading'}
            />

            <Group justify="center" mt="xl">
              <Button
                type="submit"
                size="lg"
                loading={status === 'loading'}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                Send Message
              </Button>
            </Group>
          </form>
        </Box>
      </Paper>
    </div>
  )
}