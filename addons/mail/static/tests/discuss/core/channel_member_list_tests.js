/* @odoo-module */

import { createLocalId } from "@mail/utils/common/misc";
import { Command } from "@mail/../tests/helpers/command";
import { click, contains, start, startServer } from "@mail/../tests/helpers/test_utils";

import { nextTick } from "@web/../tests/helpers/utils";

QUnit.module("channel member list");

QUnit.test(
    "there should be a button to show member list in the thread view topbar initially",
    async () => {
        const pyEnv = await startServer();
        const partnerId = pyEnv["res.partner"].create({ name: "Demo" });
        const channelId = pyEnv["discuss.channel"].create({
            name: "TestChanel",
            channel_member_ids: [
                Command.create({ partner_id: pyEnv.currentPartnerId }),
                Command.create({ partner_id: partnerId }),
            ],
            channel_type: "channel",
        });
        const { openDiscuss } = await start();
        openDiscuss(channelId);
        await contains("[title='Show Member List']");
    }
);

QUnit.test(
    "should show member list when clicking on show member list button in thread view topbar",
    async () => {
        const pyEnv = await startServer();
        const partnerId = pyEnv["res.partner"].create({ name: "Demo" });
        const channelId = pyEnv["discuss.channel"].create({
            name: "TestChanel",
            channel_member_ids: [
                Command.create({ partner_id: pyEnv.currentPartnerId }),
                Command.create({ partner_id: partnerId }),
            ],
            channel_type: "channel",
        });
        const { openDiscuss } = await start();
        openDiscuss(channelId);
        await click("[title='Show Member List']");
        await contains(".o-discuss-ChannelMemberList");
    }
);

QUnit.test("should have correct members in member list", async () => {
    const pyEnv = await startServer();
    const partnerId = pyEnv["res.partner"].create({ name: "Demo" });
    const channelId = pyEnv["discuss.channel"].create({
        name: "TestChanel",
        channel_member_ids: [
            Command.create({ partner_id: pyEnv.currentPartnerId }),
            Command.create({ partner_id: partnerId }),
        ],
        channel_type: "channel",
    });
    const { openDiscuss } = await start();
    openDiscuss(channelId);
    await click("[title='Show Member List']");
    await contains(".o-discuss-ChannelMember", 2);
    await contains(`.o-discuss-ChannelMember:contains("${pyEnv.currentPartner.name}")`);
    await contains(".o-discuss-ChannelMember:contains('Demo')");
});

QUnit.test(
    "there should be a button to hide member list in the thread view topbar when the member list is visible",
    async () => {
        const pyEnv = await startServer();
        const partnerId = pyEnv["res.partner"].create({ name: "Demo" });
        const channelId = pyEnv["discuss.channel"].create({
            name: "TestChanel",
            channel_member_ids: [
                Command.create({ partner_id: pyEnv.currentPartnerId }),
                Command.create({ partner_id: partnerId }),
            ],
            channel_type: "channel",
        });
        const { openDiscuss } = await start();
        openDiscuss(channelId);
        await click("[title='Show Member List']");
        await contains("[title='Hide Member List']");
    }
);

QUnit.test("chat with member should be opened after clicking on channel member", async (assert) => {
    const pyEnv = await startServer();
    const partnerId = pyEnv["res.partner"].create({ name: "Demo" });
    pyEnv["res.users"].create({ partner_id: partnerId });
    const channelId = pyEnv["discuss.channel"].create({
        name: "TestChanel",
        channel_member_ids: [
            Command.create({ partner_id: pyEnv.currentPartnerId }),
            Command.create({ partner_id: partnerId }),
        ],
        channel_type: "channel",
    });
    const { openDiscuss } = await start();
    openDiscuss(channelId);
    await click("[title='Show Member List']");
    await click(".o-discuss-ChannelMember.cursor-pointer");
    await contains(".o-mail-AutoresizeInput[title='Demo']");
});

QUnit.test("should show a button to load more members if they are not all loaded", async () => {
    // Test assumes at most 100 members are loaded at once.
    const pyEnv = await startServer();
    const channel_member_ids = [];
    for (let i = 0; i < 101; i++) {
        const partnerId = pyEnv["res.partner"].create({ name: "name" + i });
        channel_member_ids.push(Command.create({ partner_id: partnerId }));
    }
    const channelId = pyEnv["discuss.channel"].create({
        name: "TestChanel",
        channel_type: "channel",
    });
    const { openDiscuss } = await start();
    openDiscuss(channelId);
    pyEnv["discuss.channel"].write([channelId], { channel_member_ids });
    await click("[title='Show Member List']");
    await contains("button:contains(Load more)");
});

QUnit.test("Load more button should load more members", async (assert) => {
    // Test assumes at most 100 members are loaded at once.
    const pyEnv = await startServer();
    const channel_member_ids = [];
    for (let i = 0; i < 101; i++) {
        const partnerId = pyEnv["res.partner"].create({ name: "name" + i });
        channel_member_ids.push(Command.create({ partner_id: partnerId }));
    }
    const channelId = pyEnv["discuss.channel"].create({
        name: "TestChanel",
        channel_type: "channel",
    });
    const { openDiscuss } = await start();
    openDiscuss(channelId);
    pyEnv["discuss.channel"].write([channelId], { channel_member_ids });
    await click("[title='Show Member List']");
    await click("[title='Load more']");
    await contains(".o-discuss-ChannelMember", 102);
});

QUnit.test("Channel member count update after user joined", async (assert) => {
    const pyEnv = await startServer();
    const channelId = pyEnv["discuss.channel"].create({ name: "General" });
    const userId = pyEnv["res.users"].create({ name: "Harry" });
    pyEnv["res.partner"].create({ name: "Harry", user_ids: [userId] });
    const { openDiscuss } = await start();
    openDiscuss(channelId);
    await click("[title='Show Member List']");
    await contains(".o-discuss-ChannelMemberList:contains(Offline - 1)");
    await click("[title='Add Users']");
    await click(".o-discuss-ChannelInvitation-selectable:contains(Harry)");
    await click("[title='Invite to Channel']:not(:disabled)");
    await contains(".o-discuss-ChannelInvitation", 0);
    await click("[title='Show Member List']");
    await contains(".o-discuss-ChannelMemberList:contains(Offline - 2)");
});

QUnit.test("Channel member count update after user left", async (assert) => {
    const pyEnv = await startServer();
    const userId = pyEnv["res.users"].create({ name: "Dobby" });
    const partnerId = pyEnv["res.partner"].create({ name: "Dobby", user_ids: [userId] });
    const channelId = pyEnv["discuss.channel"].create({
        name: "General",
        channel_member_ids: [
            Command.create({ partner_id: pyEnv.currentPartnerId }),
            Command.create({ partner_id: partnerId }),
        ],
    });
    const { env, openDiscuss } = await start();
    openDiscuss(channelId);
    const thread = env.services["mail.store"].threads[createLocalId("discuss.channel", channelId)];
    assert.strictEqual(thread.memberCount, 2);
    await pyEnv.withUser(userId, () =>
        env.services.orm.call("discuss.channel", "action_unfollow", [channelId])
    );
    await nextTick();
    assert.strictEqual(thread.memberCount, 1);
});
