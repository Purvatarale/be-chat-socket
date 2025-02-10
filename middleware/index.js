const validateVouchTokens = (req, res, next) => {
  const {
    "x-vouch-user": vouchUser,
    "x-vouch-idp-idnumber": vouchIdPIdNumber="20004113",
    "x-vouch-emptype": vouchEmpType="prjstf",
    "x-vouch-idp-cname": cname="Purva Tarale",
  } = req.headers;

  try {
    let email = ""
    if (!vouchUser) {
      email = `${vouchIdPIdNumber}@iitb.ac.in`
    }

    req.user = {
      userID: vouchIdPIdNumber,
      email: vouchUser || email,
      idpIdNumber: vouchIdPIdNumber,
      empType: vouchEmpType,
      name: cname,
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = validateVouchTokens;