import PropTypes from "prop-types";
import i18n from "@dhis2/d2-i18n";
import { useDataMutation, useAlert } from "@dhis2/app-runtime";
import { useState, useEffect } from "react";
import { mapLimit } from "async";
import { chunk, filter, reduce } from "lodash";
import ImportResponse from "./ImportResponse";
import ImportError from "./ImportError";
import NoOrgUnitData from "./NoOrgUnitData";
import DataLoader from "../shared/DataLoader";
import styles from "./styles/ImportData.module.css";

const dataImportMutation = {
  resource: "dataValueSets",
  type: "create",
  data: (dataValues) => dataValues,
};

const IMPORT_LIMIT = 500;
const IMPORT_REQUEST_LIMIT = 5;

const ImportData = ({ data, dataElement, features }) => {
  const { show: showErrorAlert } = useAlert(({ message }) => message, {
    duration: 3000,
    critical: true,
  });
  const [response, setResponse] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mutate, { error }] = useDataMutation(dataImportMutation);

  useEffect(() => {
    setResponse(null);
    setImporting(true);
    const chunkedData = chunk(
      filter(data, (d) => !isNaN(d.value)),
      IMPORT_LIMIT,
    );

    var progressCount = 0;
    mapLimit(chunkedData, IMPORT_REQUEST_LIMIT, async (dataChunk) => {
      const response = await mutate({
        dataValues: dataChunk.map((obj) => ({
          value: obj.value,
          orgUnit: obj.ou,
          dataElement: dataElement.id,
          period: obj.period,
        })),
      });
      progressCount++;
      setProgress(Math.round((progressCount / chunkedData.length) * 100));
      return response;
    })
      .then((dataImportRespsonse) => {
        // reducing the response to get the total number of imported values
        const accumulatedImportResponse = reduce(
          dataImportRespsonse,
          (accumulatedResponse, batchRepsonse) => {
            var response = {};

            // support for 2.38 +
            if (batchRepsonse.httpStatus === "OK") {
              response = batchRepsonse.response;
            }
            // support for 2.37
            else if (batchRepsonse.status === "SUCCESS") {
              response = batchRepsonse;
            }
            // for error response
            else if (batchRepsonse.status === "ERROR") {
              response = batchRepsonse.response;
            }

            return {
              ...accumulatedResponse,
              conflict: [
                ...(accumulatedResponse.conflict ?? []),
                ...(response.conflicts ?? []),
              ],
              importCount: {
                imported:
                  (accumulatedResponse.importCount?.imported ?? 0) +
                  response.importCount.imported,
                updated:
                  (accumulatedResponse.importCount?.updated ?? 0) +
                  response.importCount.updated,
                ignored:
                  (accumulatedResponse.importCount?.ignored ?? 0) +
                  response.importCount.ignored,
              },
            };
          },
          {},
        );
        setResponse(accumulatedImportResponse);
        setImporting(false);
      })
      .catch((e) => {
        console.error(e);
        setResponse(null);
        setImporting(false);
        showErrorAlert({
          message: i18n.t(
            "An error occurred while importing data. Please try again.",
          ),
        });
      });
  }, [mutate, data, dataElement]);
  return (
    <div className={styles.container}>
      {importing ? (
        <DataLoader
          label={i18n.t("Importing data... {{progress}}%", { progress })}
        />
      ) : !importing && response ? (
        <ImportResponse {...response} />
      ) : error?.details ? (
        <ImportError {...error.details} />
      ) : (
        <></>
      )}
      <NoOrgUnitData data={data} features={features} />
    </div>
  );
};

ImportData.propTypes = {
  data: PropTypes.array.isRequired,
  dataElement: PropTypes.object.isRequired,
  features: PropTypes.array.isRequired,
};

export default ImportData;
