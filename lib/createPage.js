const createPage = async (browser, url) => {
	const page = await browser.newPage()

	await page.goto(url, {
		waitUntil: 'networkidle2'
	}, { timeout: 0 })

	return page
}

module.exports = createPage