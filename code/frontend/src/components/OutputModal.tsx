import React from "react";
import { useState, useRef, useEffect } from "react";
import { Tab, Tabs, Spinner, Button } from "react-bootstrap";
import {
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  RefreshCw,
  Clock,
  CheckCircle,
  MemoryStick,
  Cpu,
  Calendar,
  Terminal,
} from "lucide-react";
import {
  BellSimpleSlash,
  Bug,
  ClockClockwise,
  MaskSad,
  QuestionMark,
  Queue,
} from "@phosphor-icons/react";
import type { GetSubmissionResponse } from "src/hooks/useJudge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { StoredSubmission } from "src/hooks/useSubmissions";
import toast from "react-hot-toast";
import ShareButton from "./ShareButton";

interface OutputModalPropBase {
  displayingSharedCode: boolean;
}

interface OutputModalEditorProps extends OutputModalPropBase {
  submissions: StoredSubmission[];
  getSubmission: (token: string) => Promise<GetSubmissionResponse>;
  setLanguageId: React.Dispatch<React.SetStateAction<number>>;
  setSourceCode: React.Dispatch<React.SetStateAction<string | null>>;
}

interface OutputModalReadOnlyProps extends OutputModalPropBase {
  query: UseQueryResult<GetSubmissionResponse, Error>;
}

type OutputModalProps = OutputModalReadOnlyProps | OutputModalEditorProps;

const OutputModal: React.FC<OutputModalProps> = (props) => {
  // Don't set an initial active tab
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const initialRenderRef = useRef(true);
  // Keep track of the highest submission ID we've seen
  const lastSeenSubmissionRef = useRef<number>(0);
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false);
  // Function to get numeric ID from submission
  const getSubmissionId = (submission: StoredSubmission): number =>
    submission.localId;

  const submissions = props.displayingSharedCode
    ? undefined
    : (props as OutputModalEditorProps).submissions;
  const getSubmission = props.displayingSharedCode
    ? undefined
    : (props as OutputModalEditorProps).getSubmission;
  const setLanguageId = props.displayingSharedCode
    ? undefined
    : (props as OutputModalEditorProps).setLanguageId;
  const setSourceCode = props.displayingSharedCode
    ? undefined
    : (props as OutputModalEditorProps).setSourceCode;
  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need to renrender each time getSubmissionID is updated>
  useEffect(() => {
    // Skip the first render
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }
    if (!submissions) return;
    // Find the highest submission ID in the current list
    const currentMaxId = Math.max(...submissions.map(getSubmissionId));
    // If we have submissions and found a new highest ID
    if (
      submissions.length > 0 &&
      currentMaxId > lastSeenSubmissionRef.current
    ) {
      // Find the submission with the highest ID
      const latestSubmission = submissions.reduce((latest, current) => {
        const currentId = getSubmissionId(current);
        const latestId = getSubmissionId(latest);
        return currentId > latestId ? current : latest;
      });
      // Update our reference and set the active tab
      lastSeenSubmissionRef.current = currentMaxId;
      setActiveTab(latestSubmission.token);
    }
  }, [submissions]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <what?>
  useEffect(() => {
    if (props.displayingSharedCode) {
      const token = (props as OutputModalReadOnlyProps).query?.data?.token;
      if (token) {
        setActiveTab(token);
      }
    }
  }, [
    props.displayingSharedCode,
    (props as OutputModalReadOnlyProps).query?.data
  ]);
  const query =
    getSubmission !== undefined
      ? useQuery({
        queryKey: ["submission", activeTab],
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        queryFn: () => getSubmission(activeTab!),
        enabled: !!activeTab,
        refetchInterval: (data) => {
          if (
            data.state.data?.status.id === 2 ||
            data.state.data?.status.id === 1
          ) {
            setRefetchInterval(500);
            return 500;
          }
          setRefetchInterval(false);
          return false;
        },
      })
      : (props as OutputModalReadOnlyProps).query;

  const { data: submissionResult, isLoading, isError, refetch } = query;

  const handleRefresh = (token: string) => {
    if (token === activeTab) {
      refetch();
    }
  };

  const restoreCode = () => {
    if (!submissionResult) {
      toast.error("No submission result to restore code from");
      return;
    }
    if (!setLanguageId || !setSourceCode) return;
    setLanguageId(submissionResult.language.id);
    setSourceCode(atob(submissionResult.source_code));
  };

  const getStatusIcon = (id: number) => {
    switch (id) {
      case 1:
        return <Queue />;
      case 2:
        return <Spinner />;
      case 3:
        return <CheckCircle />;
      case 5:
        return <BellSimpleSlash />;
      case 13:
        return <MaskSad />;
      case 14:
        return <QuestionMark />;
      default:
        return <Bug />;
    }
  };

  const renderPerformanceCharts = () => {
    if (!submissionResult) return null;

    const memoryData = [
      { name: "Memory Usage", value: submissionResult.memory },
      { name: "Memory Limit", value: submissionResult.memory_limit },
    ];

    const timeData = [
      {
        name: "Exec Time",
        value: Number.parseFloat(submissionResult.time) * 1000,
      },
      {
        name: "Wall Time",
        value: Number.parseFloat(submissionResult.wall_time) * 1000,
      },
      {
        name: "CPU Time Limit",
        value: Number.parseFloat(submissionResult.cpu_time_limit) * 1000,
      },
    ];

    return (
      <div className="mb-4">
        <h5 className="font-semibold mb-2">Performance Metrics</h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h6 className="text-center">Memory Usage (KB)</h6>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memoryData}>
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h6 className="text-center">Time Usage (milliseconds)</h6>
            <ResponsiveContainer width="100%" height={305}>
              <BarChart data={timeData}>
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={105}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderSubmissionResult = () => {
    if (!activeTab) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="mb-2">No submission selected</p>
            <p className="text-sm">
              Select a submission to view results or execute code to create a
              new submission
            </p>
          </div>
        </div>
      );
    }
    if (isLoading) return <Spinner animation="border" />;
    if (isError)
      return (
        <div className="text-red-500">Error fetching submission result</div>
      );
    if (!submissionResult) return null;
    if (isLoading) return <Spinner animation="border" />;
    if (isError)
      return (
        <div className="text-red-500">Error fetching submission result</div>
      );
    if (!submissionResult) return null;
    return (
      <div className="bg-[#2c2a2a] rounded-lg shadow-lg overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-bold flex items-center relative w-full">
            {getStatusIcon(submissionResult.status.id)}
            <span className="ml-2">
              {submissionResult.status.id === 3
                ? "Executed"
                : submissionResult.status.description}
            </span>
            {refetchInterval && (
              <span className="text-sm text-gray-400 ml-2">
                Refreshing... Interval: {refetchInterval}ms
              </span>
            )}
            {(!refetchInterval && !props.displayingSharedCode) && (
              <div className="flex items-center ml-auto">
                <span className="text-sm text-gray-400">
                  <Button
                    variant="outline-secondary"
                    onClick={() => restoreCode()}
                  >
                    <ClockClockwise alt="Restore Code" />
                  </Button>
                </span>
                <ShareButton token={submissionResult.token} />
              </div>
            )}
          </h4>
        </div>

        <div className="text-sm">
          <span className="mr-2 font-extrabold">
            {submissionResult.language.name}
          </span>
          <span>exited with code {submissionResult.exit_code}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm mb-4 mt-2">
          <div className="flex items-center">
            <Clock className="mr-1 w-4 h-4" />
            <span>Exec: {submissionResult.time}s</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-1 w-4 h-4" />
            <span>Wall: {submissionResult.wall_time}s</span>
          </div>
          <div className="flex items-center">
            <Cpu className="mr-1 w-4 h-4" />
            <span>Limit: {submissionResult.cpu_time_limit}s</span>
          </div>
          <div className="flex items-center">
            <MemoryStick className="mr-1 w-4 h-4" />
            <span>Mem: {submissionResult.memory}KB</span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-1 w-4 h-4" />
            <span>
              Created:{" "}
              {new Date(submissionResult.created_at).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-1 w-4 h-4" />
            <span>
              Finished:{" "}
              {new Date(submissionResult.finished_at).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {submissionResult.stdout && (
          <div className="mb-4">
            <h5 className="font-semibold mb-2 flex items-center">
              <Terminal className="mr-2" />
              Output:
            </h5>
            <pre className="bg-[#3c3836] p-3 rounded overflow-x-auto max-h-96">
              {submissionResult.stdout}
            </pre>
          </div>
        )}
        {submissionResult.stderr && (
          <div className="mb-4">
            <h5 className="font-semibold mb-2 text-red-500 flex items-center">
              <Terminal className="mr-2" />
              Error:
            </h5>
            <pre className="bg-[#3c3836] p-3 rounded overflow-x-auto max-h-96 text-red-400">
              {submissionResult.stderr}
            </pre>
          </div>
        )}
        {submissionResult.compile_output && (
          <div className="mb-4">
            <h5 className="font-semibold mb-2 flex items-center">
              <Terminal className="mr-2" />
              Compile Output:
            </h5>
            <pre className="bg-[#3c3836] p-3 rounded overflow-x-auto max-h-96">
              {submissionResult.compile_output}
            </pre>
          </div>
        )}
        {submissionResult.message && (
          <div className="mb-4">
            <h5 className="font-semibold mb-2 flex items-center">
              <Terminal className="mr-2" />
              Message:
            </h5>
            <pre className="bg-[#3c3836] p-3 rounded overflow-x-auto max-h-96">
              {submissionResult.message}
            </pre>
          </div>
        )}
        {renderPerformanceCharts()}
      </div>
    );
  };
  const renderSubmissionTabs = () => (
    <div className="flex flex-col">
      <Tabs activeKey="submissions" className="mb-2">
        {props.displayingSharedCode ? <Tab eventKey="submissions" title="Output" /> : <Tab eventKey="submissions" title="Submissions" />}
      </Tabs>
      {submissions && (
        <div className="relative">
          <div
            className="flex overflow-x-auto overflow-y-hidden whitespace-nowrap pb-2 ml-4"
            style={{
              msOverflowStyle: "none",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="flex gap-2 min-w-min">
              {submissions.map((submission) => (
                <Button
                  key={submission.token}
                  variant={
                    activeTab === submission.token
                      ? "primary"
                      : "outline-secondary"
                  }
                  size="sm"
                  onClick={() => setActiveTab(submission.token)}
                  className="flex items-stretch"
                >
                  <div>
                    <i className={submission.iconClass} />
                    <span className="ml-1">{submission.localId}</span>
                  </div>
                  {activeTab === submission.token &&
                    submissionResult?.status_id !== 3 && (
                      <RefreshCw
                        size={14}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefresh(submission.token);
                        }}
                      />
                    )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  return (
    <div className="output-modal h-full max-h-screen flex flex-col overflow-hidden">
      <div className="flex-none">{renderSubmissionTabs()}</div>
      <div className="flex-1 overflow-auto">
        {activeTab && renderSubmissionResult()}
      </div>
    </div>
  );
};

export default OutputModal;
