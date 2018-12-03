import jsqr from "jsqr"

import { parseHostMessage, IHCSimple, IHostResult, allToObj } from "../../src/helpers/webrtc/hostproto"
import { JsonRpc } from "../../src/helpers/webrtc/jsonrpc"
import { singleton as webrtc } from "../../src/helpers/webrtc/webrtcsingleton"

describe('login test', () =>
{
	function showQr(elemSelector: string, qrName: string)
	{
		cy.wait(800)
		cy.document().then(doc =>
		{
			cy.fixture(`qr/${qrName}.mp4`, 'base64').then(mov =>
			{
				let uri = `data:video/mp4;base64,${mov}`
				let el = doc.querySelector(elemSelector)

				if (!el)
					throw `video element "${elemSelector}" not found`
		
				el.setAttribute('src', uri)
				cy.get('video').should('have.attr', 'src', uri)
			})
		})
		cy.wait(600)
	}
	function getQrData(elem: JQuery<HTMLElement>): Promise<string>
	{
		return new Promise((res, rej) =>
		{
			let svg = elem[0] as unknown as SVGSVGElement
		
			let canvas = document.createElement('canvas')
			
			let ctx = canvas.getContext('2d')!
			let loader = new Image()
			loader.width = canvas.width = 200
			loader.height = canvas.height = 200
			loader.onload = () =>
			{
				ctx.drawImage(loader, 0, 0, loader.width, loader.height)
				let data = ctx.getImageData(0, 0, canvas.width, canvas.height)
				let qr = jsqr(data.data, data.width, data.height)
				expect(qr).not.null
				// console.log(qr)
				res(qr!.data)
			}
			loader.src = 'data:image/svg+xml,' + encodeURIComponent(new XMLSerializer().serializeToString(svg))
		})
	}
	function checkShownQr(text: string | RegExp): Promise<string>
	{
		return new Promise((res, rej) =>
		{
			cy.get('svg').should(async (elem) =>
			{
				let qr = await getQrData(elem)
				console.log(`qr: ${qr}`)
				if (typeof text === "string")
					expect(qr).eq(text)
				else
					expect(qr).match(text)
				
				res(qr)
			})
		})
	}
	it('should render login page correctly', () =>
	{
		cy.visit('/')
		cy.contains('Login using QR code').click()
		cy.url().should('include', '/login')
	})

	it('should login with qr', () =>
	{
		cy.visit('/')
		cy.contains('Login using QR code').click()

		checkShownQr(/getWalletList\|\d+\|{"blockchains":\["eth","eos"\]}/)
		showQr('video', 'login_single_eth_wallet')

		cy.url().should('include', '/wallets')
		cy.contains(/eth wallet/i)
		cy.contains('0x5DcD6E2D92bC4F96F9072A25CC8d4a3A4Ad07ba0')
	})

	it('should login directly on /login', () =>
	{
		cy.visit('/login')

		checkShownQr(/^getWalletList\|\d+\|{"blockchains":\["eth","eos"\]}$/)
		showQr('video', 'login_single_eth_wallet')
		
		cy.url().should('include', '/wallets')
		cy.contains(/eth wallet/i)
		cy.contains('0x5DcD6E2D92bC4F96F9072A25CC8d4a3A4Ad07ba0')
	})
	function fillForm()
	{
		cy.url().should('include', '/tx/create')
		cy.contains('To:').next('input').type('0x5DcD6E2D92bC4F96F9072A25CC8d4a3A4Ad07ba0')
		cy.contains('Enter amount:').next('div').children('strong').children('input').as("ethvalinput")
		cy.get('@ethvalinput').first().type('45.012345')
		cy.get('@ethvalinput').last().its('attr').should((attr) => parseInt(attr('value') + "").toString() == attr('value'))
	}
	it('should open tx creation window', () =>
	{
		cy.visit('/login')

		showQr('video', 'login_single_eth_wallet')
		cy.contains(/create new tx/i).click()

		fillForm()

		cy.contains('Continue').click()
	})
	interface IEthTransaction
	{
		to: string
		value: string
		nonce: number
		gasPrice: string
	}
	interface IWallet
	{
		blockchain: "eth" | "eos"
		address: string
		chainId: string | number
	}
	it('should generate tx request', async () =>
	{
		cy.visit('/login')

		showQr('video', 'login_single_eth_wallet')
		cy.contains(/create new tx/i).click()
		fillForm()
		cy.contains('Continue').click()

		let qr = await checkShownQr(/^signTransferTx\|\d+\|.+$/)
		let msg = parseHostMessage(qr) as IHCSimple<{ tx: IEthTransaction }, { wallet: IWallet }>
		expect(msg.method).eq('signTransferTx')
		expect(msg.params).not.null
		let [tx, wallet] = Array.isArray(msg.params) ? msg.params : [msg.params.tx, msg.params.wallet]
		
		expect(wallet.address.toLowerCase()).eq('0x5DcD6E2D92bC4F96F9072A25CC8d4a3A4Ad07ba0'.toLowerCase())
		expect(wallet.blockchain).eq('eth')
		expect(wallet.chainId.toString()).eq('4')

		expect(tx.value).eq('45012345000000000000')
		assert.isNumber(tx.nonce)
		expect(tx.gasPrice).match(/^[^0]\d+00000000$/)
		expect(tx.to.toLowerCase()).eq(wallet.address.toLowerCase())
	})

	async function checkWebrtcQr()
	{
		cy.get('video').should('not.exist')

		let qr = await checkShownQr(/^webrtcLogin\|\d\|.*$/)
		let msg = parseHostMessage(qr) as IHCSimple<{sid: string}, { url: string }>
		expect(msg.method).eq('webrtcLogin')
		expect(msg.id).match(/\d+/)
		expect(msg.params).not.null
		let [sid, url] = Array.isArray(msg.params) ? msg.params : [msg.params.sid, msg.params.url]
		expect(sid).match(/^session0\.\d+$/)
		expect(url).eq('wss://duxi.io/shake')
		return { sid, url }
	}
	it('should open webrtc login page', async () =>
	{
		cy.visit('/')
		// cy.contains('WebRTC login').click()
		cy.contains(/WebRTC login/i).click()

		cy.url().should('match', /[\/webrtc|\/login\?rtc=true]/)

		await checkWebrtcQr()
	})
	it.skip('should navigate directly to webrtc login page', async () =>
	{
		cy.visit('/login?webrtc=true')

		await checkWebrtcQr()
	})

	async function connectWebrtc()
	{
		let { sid, url } = await checkWebrtcQr()
		let ws = new WebSocket(url)
		let ice = [] as any[]
		
		let jrpc = new JsonRpc(msg => (/* console.log('OUT>',msg), */ws.send(msg)), (json, cb) =>
		{
			// console.log('<IN', json)
			expect(json.method).eq('ice')
			let [cand] = Array.isArray(json.params) ? json.params : [json.params.ice]
			ice ? ice.push(cand) : webrtc.rtc.pushIceCandidate(cand)
		})
		ws.addEventListener('message', ev => jrpc.onMessage(ev.data.toString()))
		ws.addEventListener('open', async () =>
		{
			let result = await jrpc.callRaw("join", { sid }) as { offer: string}
			// console.log(result)
			let offer = result.offer
			// console.log(offer)
			assert.isString(offer)
			// console.log('#### 1')
			let answer = await webrtc.rtc.pushOffer({ sdp: offer, type: "offer" })
			// console.log('#### 2')
			jrpc.callRaw("answer", { answer: answer.sdp })
			// console.log('#### 3')
			//@ts-ignore
			webrtc.rtc.on('ice', cand => jrpc.callRaw('ice', { ice: cand }))
			// console.log('#### 4')
			await Promise.all(webrtc.rtc.candidates.map(ice => jrpc.callRaw('ice', { ice })))
			// console.log('#### 5')
			let iice = ice
			// console.log('#### 6')
			ice = undefined as any
			// console.log('#### 7')
			await Promise.all(iice.map(cand => webrtc.rtc.pushIceCandidate(cand)))
			// console.log('#### 8')
		})
		let gotRequest = new Promise((res, rej) =>
		{
			webrtc.jrpc.onRequest = (json, cb) =>
			{
				// console.log(`$request`, json)
				expect(json.method).eq("getWalletList")
				if (Array.isArray(json.params))
					expect(json.params).eql([['eth','eos']])
				else
					expect(json.params).eql({blockchains:['eth','eos']})
				
				res()
			}
		})
		// console.log("^^^ 1")
		await webrtc.rtc.waitConnection()
		// console.log("^^^ 2")
		await gotRequest
		// console.log("^^^ 3")
	}
	it('should connect webrtc', async () =>
	{
		cy.visit('/')
		cy.contains(/WebRTC login/i).click()
		
		await connectWebrtc()
	})
	
	it.skip('should login with qr multiple wallets', () =>
	{
		cy.visit('/')
		cy.contains('Login using QR code').click()
		
		showQr('video', 'login_multiple_eth_wallets')

		cy.url().should('include', '/wallets')
		cy.contains('0x5DcD6E2D92bC4F96F9072A25CC8d4a3A4Ad07ba0')
		cy.contains('0x30384424F1Ab508F1f82b58f1335f343ABdF68AE')
		cy.contains('0x1AD80eC32FD6Ef24e80801e90C5f7e32950C2D05')
	})
})