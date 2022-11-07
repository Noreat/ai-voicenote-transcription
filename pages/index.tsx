import { Heading, VStack, Text, HStack, Box } from '@chakra-ui/react';

export default function Home() {
  return (
    <Box height={'100vh'} background={'black'}>
      <VStack>
        <Heading fontSize={'60px'} color='white' mt={'5rem'}>
          AI VoiceNote
        </Heading>
        <Text fontSize={'28px'} color='white' fontStyle={'italic'}>
          Transcribe any WhatsApp voice note
        </Text>

        <Text fontSize={'50px'} pt='5rem' color='white'>
          Send any voice note to on WhatsApp:
        </Text>
        <Text fontSize={'50px'} color='white'>
          <a href='https://wa.me/14159035826'>+1 (415) 903-5826</a>
        </Text>
      </VStack>
    </Box>
  );
}
