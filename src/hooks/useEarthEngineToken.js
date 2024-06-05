import { useDataEngine, useAlert } from "@dhis2/app-runtime";

const tokenQuery = {
  token: {
    resource: "tokens/google",
  },
};

const useEarthEngineToken = () => {
  const engine = useDataEngine();
  const { show: showErrorAlert } = useAlert(({ message }) => message, {
    duration: 3000,
    critical: true,
  });

  return engine
    .query(tokenQuery)
    .then((data) => ({ ...data.token, token_type: "Bearer" }))
    .catch((error) => {
      // when failed to fetch token, return null
      showErrorAlert({ message: i18n.t("Failed to fetch Earth Engine token") });
      console.error("Failed to fetch Earth Engine token", error);
      return null;
    });
};

export default useEarthEngineToken;
