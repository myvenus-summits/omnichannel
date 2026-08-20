import { isPlaceholderContactName } from './webhook.service';

/**
 * 대화 이름은 생성 시점에만 채워져서, 한번 비면 계속 비어 있었다.
 * (끌리메 웹훅 유실분 백필 311건이 번호만 들어간 상태로 남은 게 이 문제다.)
 * 이제 다음 인바운드에서 채우는데, **실명은 절대 덮지 않는다** 는 게 핵심 계약이다.
 */
describe('isPlaceholderContactName', () => {
  it('비어 있으면 placeholder 로 본다', () => {
    expect(isPlaceholderContactName(null)).toBe(true);
    expect(isPlaceholderContactName(undefined)).toBe(true);
    expect(isPlaceholderContactName('')).toBe(true);
    expect(isPlaceholderContactName('   ')).toBe(true);
  });

  it('번호만 들어간 백필 이름을 placeholder 로 본다', () => {
    expect(isPlaceholderContactName('+61417460236')).toBe(true);
    expect(isPlaceholderContactName('821020252266')).toBe(true);
    expect(isPlaceholderContactName('+82 10-2025-2266')).toBe(true);
    expect(isPlaceholderContactName('(02) 123-4567')).toBe(true);
  });

  it('채널 접두어가 붙은 식별자도 placeholder 로 본다', () => {
    expect(isPlaceholderContactName('whatsapp:+61417460236')).toBe(true);
    expect(isPlaceholderContactName('instagram:12345678')).toBe(true);
  });

  it('실명은 placeholder 가 아니다 — 덮어쓰면 안 된다', () => {
    expect(isPlaceholderContactName('Dabin Bae')).toBe(false);
    expect(isPlaceholderContactName('노지훈')).toBe(false);
    expect(isPlaceholderContactName('Rina Maharani')).toBe(false);
    expect(isPlaceholderContactName('glowwithrina')).toBe(false);
  });

  it('숫자가 섞인 실명은 실명으로 본다', () => {
    // IG 핸들에 숫자가 흔하다. 번호로 오인해 덮어쓰면 안 된다.
    expect(isPlaceholderContactName('rina_92')).toBe(false);
    expect(isPlaceholderContactName('clinic 365')).toBe(false);
  });
});
