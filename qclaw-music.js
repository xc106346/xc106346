/**
 * QClaw Music - 高级音乐聚合插件
 * 融合自: cloudmusic.js + demo.js
 * 支持: 网易云、QQ音乐、酷我、B站、Apple Music、Spotify等
 */

const $config = argsify($config_str)
const cheerio = createCheerio()
const CryptoJS = createCryptoJS()

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA }

// ==================== 支持的音源 ====================
const ALL_SOURCES = [
	{ id: 'netease', name: '网易云', type: 'cn' },
	{ id: 'tencent', name: 'QQ音乐', type: 'cn' },
	{ id: 'kuwo', name: '酷我', type: 'cn' },
	{ id: 'kugou', name: '酷狗', type: 'cn' },
	{ id: 'migu', name: '咪咕', type: 'cn' },
	{ id: 'bilibili', name: 'B站', type: 'cn' },
	{ id: 'joox', name: 'JOOX', type: 'hk' },
	{ id: 'spotify', name: 'Spotify', type: 'global' },
	{ id: 'apple', name: 'Apple Music', type: 'global' },
	{ id: 'youtube', name: 'YouTube Music', type: 'global' },
	{ id: 'tidal', name: 'Tidal', type: 'global' },
	{ id: 'deezer', name: 'Deezer', type: 'global' },
]

// ==================== API 节点配置 ====================
const API_NODES = {
	cn: 'https://music-api-cn.gdstudio.xyz/api.php',
	hk: 'https://music-api-hk.gdstudio.xyz/api.php',
	global: 'https://music-api-us.gdstudio.xyz/api.php',
	backup: 'https://api.injahow.cn/meting/'
}

// ==================== MD5 实现 (内置，无需外部依赖) ====================
!function(n) {
	function safeAdd(x, y) {
		var lsw = (x & 0xFFFF) + (y & 0xFFFF)
		var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
		return (msw << 16) | (lsw & 0xFFFF)
	}
	function bitRotateLeft(num, cnt) {
		return (num << cnt) | (num >>> (32 - cnt))
	}
	function md5cmn(q, a, b, x, s, t) {
		return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
	}
	function md5ff(a, b, c, d, x, s, t) {
		return md5cmn((b & c) | ((~b) & d), a, b, x, s, t)
	}
	function md5gg(a, b, c, d, x, s, t) {
		return md5cmn((b & d) | (c & (~d)), a, b, x, s, t)
	}
	function md5hh(a, b, c, d, x, s, t) {
		return md5cmn(b ^ c ^ d, a, b, x, s, t)
	}
	function md5ii(a, b, c, d, x, s, t) {
		return md5cmn(c ^ (b | (~d)), a, b, x, s, t)
	}
	function binlMD5(x, len) {
		x[len >> 5] |= 0x80 << (len % 32)
		x[(((len + 64) >>> 9) << 4) + 14] = len
		var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878
		for (var i = 0; i < x.length; i += 16) {
			var olda = a, oldb = b, oldc = c, oldd = d
			a = md5ff(a, b, c, d, x[i], 7, -680876936)
			d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
			c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
			b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
			a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
			d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
			c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
			b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
			a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
			d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
			c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
			b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
			a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
			d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
			c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
			b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)
			a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
			d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
			c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
			b = md5gg(b, c, d, a, x[i], 20, -373897302)
			a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
			d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
			c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
			b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
			a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
			d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
			c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
			b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
			a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
			d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
			c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
			b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)
			a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
			d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
			c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
			b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
			a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
			d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
			c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
			b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
			a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
			d = md5hh(d, a, b, c, x[i + 0], 11, -358537222)
			c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
			b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
			a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
			d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
			c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
			b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)
			a = md5ii(a, b, c, d, x[i], 6, -198630844)
			d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
			c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
			b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
			a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
			d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
			c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
			b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
			a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
			d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
			c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
			b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
			a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
			d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
			c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
			b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)
			a = safeAdd(a, olda)
			b = safeAdd(b, oldb)
			c = safeAdd(c, oldc)
			d = safeAdd(d, oldd)
		}
		return [a, b, c, d]
	}
	function binl2hex(binarray) {
		var hexTab = '0123456789abcdef'
		var str = ''
		for (var i = 0; i < binarray.length * 4; i++) {
			str += hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
				   hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF)
		}
		return str
	}
	function str2binl(str) {
		var bin = []
		for (var i = 0; i < str.length * 8; i += 8) {
			bin[i >> 5] |= (str.charCodeAt(i / 8) & 0xFF) << (i % 32)
		}
		return bin
	}
	function utf8Encode(str) {
		str = str.replace(/\r\n/g, '\n')
		var utftext = ''
		for (var n = 0; n < str.length; n++) {
			var c = str.charCodeAt(n)
			if (c < 128) { utftext += String.fromCharCode(c) }
			else if (c > 127 && c < 2048) { utftext += String.fromCharCode((c >> 6) | 192, (c & 63) | 128) }
			else { utftext += String.fromCharCode((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128) }
		}
		return utftext
	}
	n.md5 = function(s) {
		return binl2hex(binlMD5(str2binl(utf8Encode(s)), s.length * 8))
	}
}(this)

// ==================== CRC32 签名 (用于 API 鉴权) ====================
function generateSignature(id) {
	const timestamp = Date.now().toString().slice(0, 10)
	const signStr = `qclaw-music|1.0.0|${timestamp}|${id}`
	return md5(signStr).slice(0, 16).toUpperCase()
}

// ==================== B站 WBI 签名 ====================
const WBI_MIXIN_KEY_ENC_TAB = [
	46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
	33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
	61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
	36, 20, 34, 44, 52
]

function getMixinKey(orig) {
	let temp = ''
	WBI_MIXIN_KEY_ENC_TAB.forEach((n) => temp += orig[n])
	return temp.slice(0, 32)
}

function encWbi(params, imgKey, subKey) {
	const mixinKey = getMixinKey(imgKey + subKey)
	const currTime = Math.round(Date.now() / 1000)
	const chrFilter = /[!'()*]/g
	
	Object.assign(params, { wts: currTime })
	
	let query = []
	Object.keys(params).sort().forEach((key) => {
		query.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key].toString().replace(chrFilter, ''))}`)
	})
	query = query.join('&')
	
	const wbiSign = CryptoJS.MD5(query + mixinKey).toString()
	return `${query}&w_rid=${wbiSign}`
}

let wbiKeysCache = { img_key: '', sub_key: '', expire: 0 }

async function getWbiKeys() {
	const now = Date.now()
	if (wbiKeysCache.expire > now && wbiKeysCache.img_key) {
		return wbiKeysCache
	}
	
	try {
		const { data } = await $fetch.get('https://api.bilibili.com/x/web-interface/nav', {
			headers: { ...headers, Referer: 'https://www.bilibili.com/' }
		})
		
		let result = typeof data === 'string' ? argsify(data) : data
		const imgUrl = result?.data?.wbi_img?.img_url || ''
		const subUrl = result?.data?.wbi_img?.sub_url || ''
		
		wbiKeysCache = {
			img_key: imgUrl.slice(imgUrl.lastIndexOf('/') + 1, imgUrl.lastIndexOf('.')),
			sub_key: subUrl.slice(subUrl.lastIndexOf('/') + 1, subUrl.lastIndexOf('.')),
			expire: now + 10 * 60 * 1000 // 10分钟缓存
		}
		return wbiKeysCache
	} catch (e) {
		return { img_key: '', sub_key: '' }
	}
}

// ==================== 工具函数 ====================
function getSourceNode(sourceId) {
	const source = ALL_SOURCES.find(s => s.id === sourceId)
	return source ? API_NODES[source.type] : API_NODES.cn
}

function formatDuration(ms) {
	if (!ms) return 0
	const sec = Math.floor(ms / 1000)
	return sec > 0 ? sec : 0
}

// ==================== 应用配置 ====================
const appConfig = {
	ver: 1,
	name: 'QClaw Music',
	message: '高级音乐聚合引擎',
	warning: '⚠️ 仅供学习研究，请勿商用',
	desc: '支持网易云、QQ音乐、酷我、B站、Spotify、Apple Music等多平台',
	
	tabLibrary: {
		name: '探索',
		groups: [
			{ name: '热门推荐', type: 'song', ui: 0, showMore: true, ext: { gid: 'hot', source: 'netease' } },
			{ name: '新歌速递', type: 'song', ui: 0, showMore: true, ext: { gid: 'new', source: 'netease' } },
			{ name: '排行榜', type: 'playlist', ui: 1, showMore: true, ext: { gid: 'toplist' } },
			{ name: 'B站音乐区', type: 'song', ui: 0, showMore: true, ext: { gid: 'bilibili_music' } },
		]
	},
	
	tabMe: {
		name: '我的',
		groups: [
			{ name: '我喜欢', type: 'song' },
			{ name: '歌单', type: 'playlist' },
			{ name: '歌手', type: 'artist' },
		]
	},
	
	tabSearch: {
		name: '搜索',
		groups: ALL_SOURCES.map(s => ({
			name: s.name,
			type: 'song',
			ext: { type: 'song', source: s.id }
		}))
	}
}

// ==================== 核心接口实现 ====================

async function getConfig() {
	return jsonify(appConfig)
}

// 获取歌曲列表
async function getSongs(ext) {
	const { page = 1, gid, source = 'netease', keyword, id, period, count = 20 } = argsify(ext)
	let songs = []
	
	try {
		// B站音乐区
		if (gid === 'bilibili_music') {
			const rid = 130 // 音乐综合分区
			const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/dynamic/region?ps=${count}&pn=${page}&rid=${rid}`, {
				headers: { ...headers, Referer: 'https://www.bilibili.com/' }
			})
			
			let result = typeof data === 'string' ? argsify(data) : data
			if (result?.data?.archives) {
				result.data.archives.forEach(item => {
					songs.push({
						id: `${item.aid}`,
						name: item.title,
						cover: item.pic,
						duration: item.duration,
						artist: { id: `${item.owner.mid}`, name: item.owner.name, cover: item.owner.face },
						ext: { aid: item.aid, bvid: item.bvid, cid: item.cid, source: 'bilibili' }
					})
				})
			}
		}
		// QQ音乐排行榜
		else if (gid === 'toplist' && id) {
			const url = `https://u.y.qq.com/cgi-bin/musicu.fcg?data=${encodeURIComponent(JSON.stringify({
				detail: { module: 'musicToplist.ToplistInfoServer', method: 'GetDetail', param: { topId: parseInt(id), offset: 0, num: 100, period: period || '' } },
				comm: { ct: 24, cv: 0 }
			}))}`
			
			const { data } = await $fetch.get(url, { headers: { ...headers, Cookie: 'uin=' } })
			let result = typeof data === 'string' ? argsify(data) : data
			
			if (result?.detail?.data?.songInfoList) {
				result.detail.data.songInfoList.forEach(item => {
					songs.push({
						id: item.mid,
						name: item.name,
						cover: item.album?.mid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${item.album.mid}.jpg` : '',
						duration: item.interval || 0,
						artist: { id: item.singer[0]?.mid, name: item.singer[0]?.name || '未知歌手' },
						ext: { qid: item.mid, source: 'tencent' }
					})
				})
			}
		}
		// 通用搜索
		else {
			const text = keyword || '热门歌曲'
			songs = await searchSource(text, source, page, count)
		}
	} catch (e) {
		$console.log(`getSongs error: ${e}`)
	}
	
	return jsonify({ list: songs })
}

// 获取歌单列表
async function getPlaylists(ext) {
	const { page = 1, gid, from } = argsify(ext)
	if (page > 1) return jsonify({ list: [] })
	
	let cards = []
	
	try {
		if (gid === 'toplist') {
			// QQ音乐排行榜
			const { data } = await $fetch.get(
				'https://u.y.qq.com/cgi-bin/musicu.fcg?data=%7B%22topList%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%2C%22comm%22%3A%7B%22ct%22%3A24%7D%7D',
				{ headers: { ...headers, Cookie: 'uin=' } }
			)
			
			let result = typeof data === 'string' ? argsify(data) : data
			if (result?.topList?.data?.group) {
				result.topList.data.group.forEach(group => {
					group.toplist.forEach(item => {
						if (item.title !== 'MV榜') {
							cards.push({
								id: `${item.topId}`,
								name: item.title,
								cover: item.headPicUrl || item.frontPicUrl,
								artist: { id: 'qq', name: 'QQ音乐' },
								ext: { gid: 'toplist', id: `${item.topId}`, type: 'toplist', period: item.period }
							})
						}
					})
				})
			}
		}
	} catch (e) {
		$console.log(`getPlaylists error: ${e}`)
	}
	
	return jsonify({ list: cards })
}

// 获取歌手列表
async function getArtists(ext) {
	const { page = 1, gid, source = 'tencent', from } = argsify(ext)
	if (page > 1) return jsonify({ list: [] })
	
	let artists = []
	
	try {
		// QQ音乐歌手列表
		const { data } = await $fetch.get('https://y.qq.com/n/ryqq/singer_list', { headers })
		const $ = cheerio.load(data)
		
		$('li.singer_list__item').each((i, el) => {
			const name = $(el).find('a').attr('title')
			const href = $(el).find('a').attr('href') || ''
			const match = href.match(/singer\/(\d+)/)
			
			if (name && match) {
				artists.push({
					id: match[1],
					name: name,
					cover: `https://y.qq.com/music/photo_new/T001R500x500M000${match[1]}.jpg`,
					groups: [{ name: '热门歌曲', type: 'song', ext: { gid: 'artist', source: 'tencent', artist_name: name } }]
				})
			}
		})
	} catch (e) {
		$console.log(`getArtists error: ${e}`)
	}
	
	return jsonify({ list: artists })
}

// 搜索
async function search(ext) {
	const { text, page = 1, type, source = 'netease', count = 20 } = argsify(ext)
	if (!text) return jsonify({ list: [] })
	
	if (type === 'song') {
		const songs = await searchSource(text, source, page, count)
		return jsonify({ list: songs })
	}
	
	return jsonify({ list: [] })
}

// 多源搜索实现
async function searchSource(text, source, page = 1, count = 20) {
	let songs = []
	
	try {
		// QQ音乐直接搜索
		if (source === 'tencent') {
			const searchUrl = `http://c.y.qq.com/soso/fcgi-bin/client_search_cp?new_json=1&t=0&aggr=1&cr=1&p=${page}&n=${count}&w=${encodeURIComponent(text)}`
			const { data } = await $fetch.get(searchUrl, { headers })
			
			let result = typeof data === 'string' ? JSON.parse(data.slice(9, -1)) : data
			if (result?.data?.song?.list) {
				result.data.song.list.forEach(item => {
					songs.push({
						id: `${item.mid}`,
						name: item.name,
						cover: `https://y.gtimg.cn/music/photo_new/T002R800x800M000${item.album.mid}.jpg`,
						duration: item.interval || 0,
						artist: { id: `${item.singer[0]?.id}`, name: item.singer[0]?.name || '未知歌手' },
						ext: { qid: item.mid, source: 'tencent' }
					})
				})
			}
		}
		// B站搜索 (需要WBI签名)
		else if (source === 'bilibili') {
			const { img_key, sub_key } = await getWbiKeys()
			const params = { keyword: text, page: page }
			const query = encWbi(params, img_key, sub_key)
			
			const { data } = await $fetch.get(`https://api.bilibili.com/x/web-interface/wbi/search/all/v2?${query}`, {
				headers: { ...headers, Referer: 'https://www.bilibili.com/', Origin: 'https://www.bilibili.com' }
			})
			
			let result = typeof data === 'string' ? argsify(data) : data
			if (result?.code === 0 && result?.data?.result) {
				result.data.result.forEach(item => {
					if (item?.result_type === 'video' && item?.data) {
						item.data.forEach(v => {
							if (songs.length < count) {
								let duration = 0
								if (v.duration) {
									const parts = v.duration.split(':')
									if (parts.length === 2) duration = parseInt(parts[0]) * 60 + parseInt(parts[1])
								}
								songs.push({
									id: `${v.aid}`,
									name: v.title.replace(/<[^>]*>/g, ''),
									cover: v.pic?.startsWith('http') ? v.pic : 'https:' + v.pic,
									duration: duration,
									artist: { id: `${v.mid}`, name: v.author, cover: v.upic || '' },
									ext: { aid: v.aid, bvid: v.bvid, source: 'bilibili' }
								})
							}
						})
					}
				})
			}
		}
		// 其他平台通过聚合API
		else {
			const signature = generateSignature(text)
			const node = getSourceNode(source)
			const url = `${node}?types=search&source=${source}&name=${encodeURIComponent(text)}&count=${count}&pages=${page}&s=${signature}`
			
			const { data } = await $fetch.get(url, { headers })
			let result = typeof data === 'string' ? argsify(data) : data
			
			let list = Array.isArray(result) ? result : (result?.data || [])
			list.slice(0, count).forEach(item => {
				songs.push({
					id: `${source}_${item.id || songs.length}`,
					name: item.name || '未知歌曲',
					cover: item.pic_id ? `https://music.gdstudio.xyz/api/pic/${source}/${item.pic_id}` : '',
					duration: item.duration || 0,
					artist: { id: 'unknown', name: Array.isArray(item.artist) ? item.artist.join('/') : (item.artist || '未知歌手') },
					ext: { track_id: String(item.id || ''), source: source, pic_id: item.pic_id || '' }
				})
			})
		}
	} catch (e) {
		$console.log(`searchSource error: ${e}`)
	}
	
	return songs
}

// 获取播放URL
async function getSongInfo(ext) {
	const { track_id, source, qid, aid, cid, bvid, pic_id } = argsify(ext)
	
	try {
		// QQ音乐
		if (source === 'tencent' || qid) {
			const musicId = qid || track_id
			const apiUrl = `https://lxmusicapi.onrender.com/url/tx/${musicId}/320k`
			const { data } = await $fetch.get(apiUrl, {
				headers: { 'X-Request-Key': 'share-v2', 'User-Agent': UA }
			})
			
			let result = typeof data === 'string' ? argsify(data) : data
			if (result?.url) {
				return jsonify({
					urls: [result.url],
					headers: [{ 'User-Agent': UA, 'Referer': 'https://y.qq.com/' }],
					cover: `https://y.gtimg.cn/music/photo_new/T002R800x800M000${musicId}.jpg`
				})
			}
		}
		// B站
		else if (source === 'bilibili' || aid || bvid) {
			const { img_key, sub_key } = await getWbiKeys()
			
			// 先获取 cid
			let videoCid = cid
			if (!videoCid) {
				const infoUrl = bvid 
					? `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
					: `https://api.bilibili.com/x/web-interface/view?aid=${aid}`
				const { data: infoData } = await $fetch.get(infoUrl, {
					headers: { ...headers, Referer: 'https://www.bilibili.com/' }
				})
				let info = typeof infoData === 'string' ? argsify(infoData) : infoData
				videoCid = info?.data?.cid || info?.data?.pages?.[0]?.cid
			}
			
			if (videoCid) {
				const params = { avid: aid, cid: videoCid, qn: 16, fnval: 16, fnver: 0, fourk: 0 }
				const query = encWbi(params, img_key, sub_key)
				
				const { data } = await $fetch.get(`https://api.bilibili.com/x/player/wbi/playurl?${query}`, {
					headers: { ...headers, Referer: 'https://www.bilibili.com/', Origin: 'https://www.bilibili.com' }
				})
				
				let result = typeof data === 'string' ? argsify(data) : data
				if (result?.code === 0 && result?.data?.dash?.audio?.[0]?.baseUrl) {
					return jsonify({
						urls: [result.data.dash.audio[0].baseUrl],
						headers: [{ 'User-Agent': UA, 'Referer': `https://www.bilibili.com/video/${bvid || 'av' + aid}`, 'Origin': 'https://www.bilibili.com' }]
					})
				}
			}
		}
		// 其他平台
		else if (track_id) {
			const signature = generateSignature(track_id)
			const node = getSourceNode(source)
			const url = `${node}?types=url&source=${source}&id=${track_id}&br=999&s=${signature}`
			
			const { data } = await $fetch.get(url, { headers })
			let result = typeof data === 'string' ? argsify(data) : data
			
			if (result?.url) {
				return jsonify({
					urls: [result.url],
					headers: [{ 'User-Agent': UA, 'Referer': 'https://music.gdstudio.xyz/' }]
				})
			}
			
			// 备用API
			const backupUrl = `${API_NODES.backup}?type=url&id=${track_id}&source=${source}`
			const { data: backupData } = await $fetch.get(backupUrl, { headers: { 'User-Agent': UA } })
			let backup = typeof backupData === 'string' ? argsify(backupData) : backupData
			if (backup?.url) {
				return jsonify({ urls: [backup.url] })
			}
		}
	} catch (e) {
		$console.log(`getSongInfo error: ${e}`)
	}
	
	return jsonify({ urls: [] })
}

// 歌单详情
async function getPlaylistInfo(ext) {
	const { gid, id, period } = argsify(ext)
	
	if (gid === 'toplist' && id) {
		const songs = []
		const url = `https://u.y.qq.com/cgi-bin/musicu.fcg?data=${encodeURIComponent(JSON.stringify({
			detail: { module: 'musicToplist.ToplistInfoServer', method: 'GetDetail', param: { topId: parseInt(id), offset: 0, num: 100, period: period || '' } },
			comm: { ct: 24, cv: 0 }
		}))}`
		
		try {
			const { data } = await $fetch.get(url, { headers: { ...headers, Cookie: 'uin=' } })
			let result = typeof data === 'string' ? argsify(data) : data
			
			if (result?.detail?.data?.songInfoList) {
				result.detail.data.songInfoList.forEach(item => {
					songs.push({
						id: item.mid,
						name: item.name,
						cover: item.album?.mid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${item.album.mid}.jpg` : '',
						duration: item.interval || 0,
						artist: { id: item.singer[0]?.mid, name: item.singer[0]?.name || '未知歌手' },
						ext: { qid: item.mid, source: 'tencent' }
					})
				})
			}
		} catch (e) {}
		
		return jsonify({ list: songs })
	}
	
	return jsonify({ list: [] })
}

// 专辑详情
async function getAlbumInfo(ext) {
	return jsonify({ list: [] })
}
