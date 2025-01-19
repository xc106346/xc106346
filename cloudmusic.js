const $config = argsify($config_str);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';
const headers = {
  'User-Agent': UA,
};

const appConfig = {
  "ver": 1,
  "name": "猫耳FM",
  "message": "",
  "desc": "",
  "tabLibrary": {
    "name": "探索",
    "groups": [{
        "name": "推荐",
        "type": "song",
        "ui": 0,
        "showMore": true,
        "ext": {
            "id": '1'
        }
    }, {
        "name": "音单",
        "type": "album",
        "ui": 0,
        "showMore": true,
        "ext": {
            "id": '2'
        }
    }, {
        "name": "歌单",
        "type": "playlist",
        "ui": 1,
        "showMore": true,
        "ext": {
            "id": '3'
        }
    }, {
      "name": "排行榜",
      "type": "playlist",
      "ui": 1,
      "showMore": true,
      "ext": {
          "id": '4'
      }
    }]
  },
  "tabMe": {
    "name": "我的",
    "groups": [{
      "name": "歌曲",
      "type": "song"
    }]
  },
  "tabSearch": {
    "name": "搜索",
    "groups": [{
      "name": "歌曲",
      "type": "song",
      "ext": {
        "type": "song"
      }
    }]
  }
};

const cache = {};

const getCacheData = (key) => cache[key];

const setCacheData = (key, data, expirationTime = 3600) => {
  cache[key] = { data, timestamp: Date.now() };
  setTimeout(() => delete cache[key], expirationTime * 1000); // Expire cache after the specified time
};

const fetchData = async (url, headers) => {
  try {
    const { data } = await $fetch.get(url, { headers });
    return argsify(data);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    return null;
  }
};

async function getPaginatedData(url, page = 1, pageSize = 20) {
  try {
    const { data } = await $fetch.get(`${url}?page=${page}&pageSize=${pageSize}`, { headers });
    return argsify(data);
  } catch (error) {
    console.error(`Error fetching paginated data from ${url}:`, error);
    return null;
  }
}

async function getMultipleData(urls) {
  try {
    const promises = urls.map(url => $fetch.get(url, { headers }));
    const responses = await Promise.all(promises);
    return responses.map(response => argsify(response.data));
  } catch (error) {
    console.error(`Error fetching multiple data:`, error);
    return [];
  }
}

async function getSongs(ext) {
  const { page, id } = argsify(ext);
  const songs = [];
  if (page > 1) return jsonify({ list: [] });

  const data = await getPaginatedData('https://www.missevan.com/sound/newhomepagedata', page);
  if (data) {
    const songList = data.info.music.flatMap(genre =>
      genre.objects_point.map(each => ({
        id: `${each.id}`,
        name: each.soundstr,
        cover: each.front_cover,
        duration: parseInt(each.duration / 100),
        artist: {
          id: `${each.user_id}`,
          name: each.username
        },
        ext: {
          id: each.id
        }
      }))
    );
    songs.push(...songList);
  }

  return jsonify({ list: songs });
}

async function getArtists(ext) {
  const { page, id, from } = argsify(ext);
  return jsonify({
    list: [],
  });
}

async function getPlaylists(ext) {
  const { page, id } = argsify(ext);
  if (page > 1) return jsonify({ list: [] });

  let cards = [];
  if (id == '3') {
    const urls = ['https://www.missevan.com/explore/tagalbum?order=0'];
    const responses = await getMultipleData(urls);
    responses.forEach(response => {
      response.albums.forEach(each => {
        cards.push({
          id: `${each.id}`,
          name: each.title,
          cover: each.front_cover,
          artist: {
            id: `${each.user_id}`,
            name: each.username
          },
          ext: {
            id: each.id
          }
        });
      });
    });
  }

  return jsonify({ list: cards });
}

async function getSongInfo(ext) {
  const { url, id, qid } = argsify(ext);
  if (url) {
    const cachedSound = getCacheData(url);
    if (cachedSound) return jsonify({ urls: [cachedSound] });

    const data = await fetchData(url, headers);
    if (data) {
      setCacheData(url, data);
      return jsonify({ urls: [data] });
    }
  }

  if (id) {
    const data = await fetchData(`https://www.missevan.com/sound/getsound?soundid=${id}`, headers);
    if (data) {
      const soundUrl = argsify(data).info.sound.soundurl;
      setCacheData(id, soundUrl);
      return jsonify({ urls: [soundUrl], headers: [{ 'User-Agent': UA }] });
    }
  }

  if (qid) {
    const data = await fetchData(`https://lxmusicapi.onrender.com/url/tx/${qid}/320k`, { 'X-Request-Key': 'share-v2' });
    if (data) {
      const soundUrl = argsify(data).url;
      setCacheData(qid, soundUrl);
      return jsonify({ urls: [soundUrl] });
    }
  }

  return jsonify({ urls: [] });
}

async function search(ext) {
  const { text, page, type } = argsify(ext);
  if (page > 1) return jsonify({});

  if (type == 'song') {
    const songs = [];
    const { data } = await $fetch.get(`http://c.y.qq.com/soso/fcgi-bin/client_search_cp?new_json=1&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=1&n=20&w=${encodeURIComponent(text)}&needNewCode=0`, { headers });

    argsify(data.slice(9, -1)).data?.song?.list?.forEach(each => {
      songs.push({
        id: `${each.mid}`,
        name: each.name,
        cover: `https://y.gtimg.cn/music/photo_new/T002R800x800M000${each.album.mid}.jpg`,
        duration: 0,
        artist: {
          id: `${each.singer[0]?.id}`,
          name: each.singer[0]?.name || '',
        },
        ext: {
          qid: each.mid
        }
      });
    });

    return jsonify({
      list: songs,
    });
  }

  return jsonify({});
}
