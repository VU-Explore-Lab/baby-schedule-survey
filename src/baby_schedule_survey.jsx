import { useState } from "react";

const formatTime = (i) => {
  const hour24 = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const ampm = hour24 < 12 ? "AM" : "PM";
  return `${hour12}:${minutes} ${ampm}`;
};

const timeBlocks = Array.from({ length: 48 }, (_, i) => formatTime(i));
const categories = [
  "Sleeping",
  "Grooming & dressing",
  "Eating",
  "Indoor play",
  "Outdoor play",
  "Errands (e.g., commuting, grocery)",
  "Baby class",
  "Bathing",
  "Other"
];

const defaultCaregivers = ["Mom", "Dad", "Nanny", "Daycare", "Grandparent"];
const defaultCaregiverColors = {
  Mom: "bg-red-400",
  Dad: "bg-blue-300",
  Nanny: "bg-green-300",
};

export default function BabyScheduleSurvey() {
  const [selections, setSelections] = useState({});
  const [dragSelection, setDragSelection] = useState([]);
  const [dragCategory, setDragCategory] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingCaregivers, setPendingCaregivers] = useState([]);
  const [caregivers, setCaregivers] = useState([...defaultCaregivers]);
  const [newCaregiver, setNewCaregiver] = useState("");
  const [caregiverColors, setCaregiverColors] = useState({ ...defaultCaregiverColors });
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [parentName, setParentName] = useState("");

  const handleMouseDown = (time, category) => {
    setIsDragging(true);
    setDragCategory(category);
    const key = `${time}-${category}`;
    setDragSelection([key]);
  };

  const handleMouseEnter = (time, category) => {
    if (!isDragging || dragCategory !== category) return;
    const key = `${time}-${category}`;
    setDragSelection((prev) => {
      if (prev.includes(key)) {
        return prev;
      } else {
        return [...prev, key];
      }
    });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragSelection.length === 0) return;

    if (dragCategory === "Sleeping") {
      setSelections((prev) => {
        const newSelections = { ...prev };
        dragSelection.forEach((key) => {
          const [time, category] = key.split("-");
          newSelections[key] = { time, category, caregiver: "" };
        });
        return newSelections;
      });
      setDragSelection([]);
      setDragCategory(null);
    } else {
      setShowModal(true);
    }
  };

  const handleCaregiverSelect = () => {
    if (pendingCaregivers.length === 0) return;
    setSelections((prev) => {
      const newSelections = { ...prev };
      dragSelection.forEach((key) => {
        const [time, category] = key.split("-");
        newSelections[key] = { time, category, caregiver: pendingCaregivers.join(", ") };
      });
      return newSelections;
    });
    setDragSelection([]);
    setDragCategory(null);
    setPendingCaregivers([]);
    setShowModal(false);
  };

  const handleAddCaregiver = () => {
    if (!newCaregiver || caregivers.includes(newCaregiver)) return;
    setCaregivers((prev) => [...prev, newCaregiver]);
    setCaregiverColors((prev) => ({
      ...prev,
      [newCaregiver]: "bg-purple-300",
    }));
    setPendingCaregivers((prev) => [...prev, newCaregiver]);
    setNewCaregiver("");
  };

  const handleSubmit = async () => {
    const timestamp = new Date().toISOString();
    const payload = Object.values(selections).map((entry) => ({
      ...entry,
      parentName,
      timestamp,
    }));

    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbyXRCBZ02Ts5GlMvlbrwFQDsD03p3xpyiubOjcxW81D9QIQmCE711cYYafU5wnsIwpNLA/exec", {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",  // ← this avoids CORS preflight
          },
          body: JSON.stringify(payload),
        });


      if (response.ok) {
        setSubmissionMessage("Your responses have been submitted. Thank you!");
      } else {
        setSubmissionMessage("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting data:", error.message || error);
      setSubmissionMessage("An error occurred: " + error.message);
    }

  };

  return (
    <div className="p-4" onMouseUp={handleMouseUp}>
      <h1 className="text-2xl font-bold mb-2">Baby's Daily Schedule</h1>
      <p className="mb-4 text-sm text-gray-700">
        Please select the times when your baby is doing each activity. You can select multiple
        times by clicking and dragging. When prompted, please indicate which caregivers are
        involved in this activity. You may add additional caregivers if needed. <br />
        When finished click "Submit".
      </p>

      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium text-gray-700">Your Name:</label>
        <input
          type="text"
          className="border p-2 rounded w-full mb-4"
          placeholder="Enter your name"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
        />
      </div>
      <div className="mb-4 space-x-2">
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-3 py-1 rounded"
          disabled={!parentName}
        >
          Submit
        </button>
      </div>

      {submissionMessage && <div className="mb-4 text-green-700 font-semibold">{submissionMessage}</div>}

      <div className="overflow-auto max-h-[80vh]">
  <div className="min-w-[768px] md:min-w-full">
    <table className="border-collapse w-full text-xs md:text-sm table-fixed">
      <thead className="sticky top-0 bg-white z-50">
        <tr>
          <th className="border border-gray-500 bg-gray-100 px-2 py-2 sticky left-0 z-30">
            Time
          </th>
          {categories.map((cat) => (
            <th
              key={cat}
              className="border border-gray-500 bg-gray-100 px-2 py-2 text-sm font-semibold"
            >
              {cat}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {timeBlocks.map((time) => (
          <tr key={time}>
            <td className="border border-gray-400 bg-white px-2 py-2 sticky left-0 z-30 font-medium">
              {time}
            </td>
            {categories.map((cat) => {
              const key = `${time}-${cat}`;
              const selection = selections[key];
              const bgColor = selection
                ? caregiverColors[selection.caregiver?.split(", ")[0]] ||
                  "bg-purple-300"
                : "bg-white";
              const isSelected = dragSelection.includes(key);
              return (
                <td
                  key={key}
                  className={`border border-gray-400 px-2 py-2 text-center ${
                    isSelected ? "bg-yellow-200" : bgColor
                  }`}
                  onMouseDown={() => handleMouseDown(time, cat)}
                  onMouseEnter={() => handleMouseEnter(time, cat)}
                  title={selection?.caregiver || ""}
                >
                  {selection ? selection.caregiver : ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md w-full max-w-xs mx-2">
            <label className="block mb-2 font-semibold">Assign caregivers:</label>
            <div className="border p-2 w-full mb-2 h-32 overflow-y-auto">
              {caregivers
                .filter((cg) => cg !== "None")
                .map((cg) => (
                  <label key={cg} className="block">
                    <input
                      type="checkbox"
                      value={cg}
                      checked={pendingCaregivers.includes(cg)}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPendingCaregivers((prev) =>
                          prev.includes(value)
                            ? prev.filter((v) => v !== value)
                            : [...prev, value]
                        );
                      }}
                    />{" "}
                    {cg}
                  </label>
                ))}
            </div>
            <input
              type="text"
              value={newCaregiver}
              onChange={(e) => setNewCaregiver(e.target.value)}
              placeholder="Add new caregiver"
              className="border p-2 w-full mb-2"
            />
            <button
              onClick={handleAddCaregiver}
              className="bg-indigo-500 text-white px-3 py-1 rounded w-full mb-4"
            >
              Add Caregiver
            </button>
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setShowModal(false);
                  setDragSelection([]);
                  setDragCategory(null);
                  setPendingCaregivers([]);
                }}
                className="bg-gray-300 px-3 py-1 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCaregiverSelect}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
