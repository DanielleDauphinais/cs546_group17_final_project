import xss from "xss";

const sanitisePayload = (payload) => Object.keys(payload).reduce((acc, curr) => { return { ...acc, [curr]: xss(payload[curr]) } }, {});

const sanitise = (req, res, next) => {
	req.body = sanitisePayload(req.body);
	req.params = sanitisePayload(req.params);
	next();
};

export { sanitise };
