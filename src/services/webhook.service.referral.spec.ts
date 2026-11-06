import { isAdReferral, shouldReplaceConversationReferral } from './webhook.service';

/**
 * 대화 referral 은 "첫 유입" 이다. 그런데 광고가 아닌 referral(`{ numMedia: '0' }`·게시물 링크)이
 * 먼저 자리를 잡으면 뒤에 온 광고 클릭이 대화에 남지 않았다(MD-775).
 * 계약: 광고가 아닌 것은 광고로 바뀔 수 있고, 광고끼리는 첫 유입을 유지한다.
 */
const AD = {
  ctwaClid: 'ARclid',
  sourceId: '120209000000001',
  sourceType: 'ad',
  headline: 'Glow',
  numMedia: '0',
};
const AD_LATER = { ...AD, ctwaClid: 'ARclid-2', sourceId: '120209000000002' };
const AD_NO_CLID = { sourceId: '120209000000003', sourceType: 'ad', numMedia: '0' };
const IG_AD = { sourceId: '120209000000004', sourceType: 'ADS', headline: 'IG' };
const NUM_MEDIA_ONLY = { numMedia: '0' };
const POST_LINK = { sourceUrl: 'https://wa.me/message/ABC', numMedia: '0' };
const POST_REF = { sourceType: 'post', headline: 'Promo', numMedia: '0' };
const LANDING = { sourceId: '120209000000005', sourceType: 'landing', headline: 'Landing' };

describe('isAdReferral', () => {
  it('ctwaClid 가 있으면 광고다', () => {
    expect(isAdReferral(AD)).toBe(true);
    expect(isAdReferral({ ctwaClid: 'x' })).toBe(true);
  });

  it('sourceId 나 광고 유형(ad/ads)만 있어도 광고다 — 서비스 판정의 합집합', () => {
    expect(isAdReferral(AD_NO_CLID)).toBe(true);
    expect(isAdReferral(IG_AD)).toBe(true); // 대소문자 무시
    expect(isAdReferral({ sourceType: 'ad' })).toBe(true);
    expect(isAdReferral({ sourceId: '123', sourceUrl: 'https://wa.me/x' })).toBe(true);
    // sourceId 가 있으면 게시물 유형이어도 보호한다(일부 서비스가 sourceId 만으로 광고를 판정).
    expect(isAdReferral({ sourceType: 'post', sourceId: '123' })).toBe(true);
  });

  it('서비스가 직접 쓰는 랜딩 referral(sourceId, sourceType=landing)은 광고다', () => {
    // ctwaClid 가 없다. 이걸 덮으면 같은 리드로 Lead 이벤트가 두 번 나간다.
    expect(isAdReferral(LANDING)).toBe(true);
  });

  it('게시물·링크·numMedia 만 있는 것·빈 값은 광고가 아니다', () => {
    expect(isAdReferral({ sourceType: 'post', sourceId: '  ' })).toBe(false);
    expect(isAdReferral({ ctwaClid: '', sourceId: '' })).toBe(false);
    expect(isAdReferral(POST_REF)).toBe(false);
    expect(isAdReferral(POST_LINK)).toBe(false);
    expect(isAdReferral(NUM_MEDIA_ONLY)).toBe(false);
  });

  it('객체가 아니면 광고가 아니다', () => {
    expect(isAdReferral(undefined)).toBe(false);
    expect(isAdReferral(null)).toBe(false);
    expect(isAdReferral('ad')).toBe(false);
    expect(isAdReferral({ ctwaClid: 123 })).toBe(false);
  });
});

describe('shouldReplaceConversationReferral', () => {
  it('대화 referral 이 없으면 메시지 referral 로 채운다', () => {
    expect(shouldReplaceConversationReferral(undefined, AD)).toBe(true);
    expect(shouldReplaceConversationReferral(null, POST_LINK)).toBe(true);
  });

  it('대화 referral 이 numMedia 뿐이면 비어 있는 것으로 보고 채운다', () => {
    expect(shouldReplaceConversationReferral(NUM_MEDIA_ONLY, AD)).toBe(true);
    expect(shouldReplaceConversationReferral(NUM_MEDIA_ONLY, POST_LINK)).toBe(true);
    expect(shouldReplaceConversationReferral({}, AD)).toBe(true);
  });

  it('대화 referral 이 광고가 아니면 뒤의 광고 referral 로 바꾼다', () => {
    expect(shouldReplaceConversationReferral(POST_LINK, AD)).toBe(true);
    expect(shouldReplaceConversationReferral(POST_REF, IG_AD)).toBe(true);
  });

  it('광고 referral 끼리는 첫 유입을 유지한다', () => {
    expect(shouldReplaceConversationReferral(AD, AD_LATER)).toBe(false);
    expect(shouldReplaceConversationReferral(AD_NO_CLID, AD)).toBe(false);
  });

  it('랜딩 referral 은 뒤의 CTWA 광고 클릭으로 바꾸지 않는다', () => {
    expect(shouldReplaceConversationReferral(LANDING, AD)).toBe(false);
  });

  it('광고가 아닌 referral 은 다른 광고 아닌 referral 이나 광고를 덮지 않는다', () => {
    expect(shouldReplaceConversationReferral(POST_LINK, POST_REF)).toBe(false);
    expect(shouldReplaceConversationReferral(AD, POST_LINK)).toBe(false);
  });

  it('메시지 referral 이 없거나 numMedia 뿐이면 아무것도 하지 않는다', () => {
    expect(shouldReplaceConversationReferral(undefined, undefined)).toBe(false);
    expect(shouldReplaceConversationReferral(undefined, NUM_MEDIA_ONLY)).toBe(false);
    expect(shouldReplaceConversationReferral(NUM_MEDIA_ONLY, NUM_MEDIA_ONLY)).toBe(false);
    expect(shouldReplaceConversationReferral(POST_LINK, { numMedia: '', sourceId: null })).toBe(false);
  });
});

describe('Instagram referral 도 같은 규칙', () => {
  it('ig.me 링크(SHORTLINK) referral 은 뒤의 IG 광고 referral 로 바뀐다', () => {
    const shortlink = { sourceType: 'SHORTLINK', sourceUrl: 'promo-ref' };
    const igAd = { sourceId: '120209000000006', sourceType: 'ADS', headline: 'IG ad' };
    expect(isAdReferral(shortlink)).toBe(false);
    expect(shouldReplaceConversationReferral(shortlink, igAd)).toBe(true);
    expect(shouldReplaceConversationReferral(igAd, shortlink)).toBe(false);
  });
});
