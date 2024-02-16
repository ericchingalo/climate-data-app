import PropTypes from "prop-types";
import i18n from "@dhis2/d2-i18n";
import styles from "./styles/ImportResponse.module.css";

const ImportResponse = ({ importCount }) => {
  const { imported, updated, ignored } = importCount;
  return (
    <>
      <div className={styles.title}>{i18n.t("Data is imported")}</div>
      <div>{i18n.t("Imported: {{imported}}", { imported })}</div>
      <div>{i18n.t("Updated: {{updated}}", { updated })}</div>
      <div>{i18n.t("Ignored: {{ignored}}", { ignored })}</div>
    </>
  );
};

ImportResponse.propTypes = {
  importCount: PropTypes.object.isRequired,
};

export default ImportResponse;
