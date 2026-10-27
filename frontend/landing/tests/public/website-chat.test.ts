import { expect, it } from 'vitest'
import { websiteChatOrigin } from '~/utils/website-chat'
it('limits chat scripts to an explicit HTTPS origin, with opt-in loopback UAT',()=>{
  expect(websiteChatOrigin('https://chat.example.test')).toBe('https://chat.example.test')
  for(const bad of ['javascript:alert(1)','http://chat.example.test','https://user:pass@example.test','https://example.test/a','https://example.test/?token=a']) expect(websiteChatOrigin(bad)).toBeUndefined()
  expect(websiteChatOrigin('http://127.0.0.1:13090')).toBeUndefined()
  expect(websiteChatOrigin('http://127.0.0.1:13090',true)).toBe('http://127.0.0.1:13090')
})
