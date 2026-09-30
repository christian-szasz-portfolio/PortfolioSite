namespace Analytics.Tools.Security;

/// <summary>One thing that was checked and what came back, with the reason beside the verdict.</summary>
public sealed class ProbeResult
{
    private ProbeResult(string name, bool passed, string detail)
    {
        this.Name = name;
        this.Passed = passed;
        this.Detail = detail;
    }

    /// <summary>What was checked.</summary>
    public string Name { get; }

    /// <summary>Whether it held.</summary>
    public bool Passed { get; }

    /// <summary>What was actually observed, pass or fail.</summary>
    public string Detail { get; }

    public static ProbeResult Pass(string name, string detail)
    {
        return new ProbeResult(name, true, detail);
    }

    public static ProbeResult Fail(string name, string detail)
    {
        return new ProbeResult(name, false, detail);
    }

    public override string ToString()
    {
        return $"{(this.Passed ? "PASS" : "FAIL")}  {this.Name}{Environment.NewLine}        {this.Detail}";
    }
}
