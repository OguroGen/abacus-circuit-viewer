// LIFFの初期化処理

export const initializeLiff = async (liffId) => {
    const liff = await import('@line/liff');
    
    try {
      await liff.default.init({ liffId });
      console.log('LIFF初期化成功');
      return liff.default;
    } catch (error) {
      console.error('LIFF初期化エラー', error);
      throw error;
    }
  };