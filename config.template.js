module.exports = {
  casper: {
    pageSettings: {
      loadImages: false
    },
    waitTimeout: 30000
  },
  action: {
    username: 'kputrajaya',
    password: 'xxx',
    hashtags: [
    {
      tag: 'streetphotography',
      like: true,
      comment: 'Amazing shot!'
    },
    {
      tag: 'travelphotography',
      like: true
    }
    ]
  }
};
